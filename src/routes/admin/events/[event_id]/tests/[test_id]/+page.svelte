<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import {
		TextArea,
		TextInput,
		Modal,
		Accordion,
		AccordionItem,
	} from "carbon-components-svelte";
	import MathJax from "$lib/components/MathJax.svelte";
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getTest,
		updateTest,
		getTestProblems,
		updateTestProblems,
		getAllProblems,
        addNewTestProblem,
        deleteTestProblem,
        replaceTestProblem,
	} from "$lib/supabase";
	import Problem from "$lib/components/Problem.svelte";
	import Katex from "$lib/components/Katex.svelte";

	let loading = true;

	let titleEditable = false;
	let lengthEditable = false;
	let bufferEditable = false;
	let instructionsEditable = false;

	let modalProblem = null;

	let test_id = Number($page.params.test_id);
	let is_team = $page.params.test_id.charAt(0) == "t" ? true : false;

	let user;
	let test;
	let problems;
	let test_taker;
	let allProblems;

	(async () => {
		user = await getThisUser();
		test = await getTest(test_id);
		problems = await getTestProblems(test_id, "*, problems(*)");
		allProblems = await getAllProblems();
		loading = false;
	})();

	// Function to move the problem up (and across pages if necessary)
	function moveUp(index) {
		if (index > 0) {
			const currentProblem = problems[index];
			const previousProblem = problems[index - 1];

			// Swap problem_order and page_number if on different pages
			if (currentProblem.page_number !== previousProblem.page_number) {
				const tempPageNumber = currentProblem.page_number;
				currentProblem.page_number = previousProblem.page_number;
				previousProblem.page_number = tempPageNumber;
			}

			// Swap problem_order
			[currentProblem.problem_order, previousProblem.problem_order] = [
				previousProblem.problem_order,
				currentProblem.problem_order,
			];

			// Swap positions in the array
			problems[index - 1] = currentProblem;
			problems[index] = previousProblem;

			// Resort problems after the swap
			problems.sort(
				(a, b) =>
					a.page_number - b.page_number ||
					a.problem_order - b.problem_order,
			);
		}
	}

	// Function to move the problem down (and across pages if necessary)
	function moveDown(index) {
		if (index < problems.length - 1) {
			const currentProblem = problems[index];
			const nextProblem = problems[index + 1];

			// Swap problem_order and page_number if on different pages
			if (currentProblem.page_number !== nextProblem.page_number) {
				const tempPageNumber = currentProblem.page_number;
				currentProblem.page_number = nextProblem.page_number;
				nextProblem.page_number = tempPageNumber;
			}

			// Swap problem_order
			[currentProblem.problem_order, nextProblem.problem_order] = [
				nextProblem.problem_order,
				currentProblem.problem_order,
			];

			// Swap positions in the array
			problems[index + 1] = currentProblem;
			problems[index] = nextProblem;

			// Resort problems after the swap
			problems.sort(
				(a, b) =>
					a.page_number - b.page_number ||
					a.problem_order - b.problem_order,
			);
		}
	}

	async function updateTitle(event) {
		titleEditable = false;
		test.test_name = event.target.innerText;
		await updateTest(test.test_id, test);
	}

	async function updateLength(event) {
		lengthEditable = false;
		test.length = parseInt(event.target.innerText);
		await updateTest(test.test_id, test);
	}

	async function updateBuffer(event) {
		bufferEditable = false;
		test.buffer_time = parseInt(event.target.innerText);
		await updateTest(test.test_id, test);
	}

	async function updateTestWithKey(event, key) {
		test[key] = event.target.value;
	}

	async function updateProblemWithKey(event, key, problem_idx) {
		problems[problem_idx][key] = event.target.value;
	}

	async function saveTest() {
		await updateTest(test.test_id, test);
		await updateTestProblems(test.test_id, problems);
		toast.success("Successfully saved");
	}

	// Group problems by page_number
	const groupByPageNumber = (problems) => {
		return problems.reduce((acc, problem) => {
			const pageNumber = problem.page_number;
			if (!acc[pageNumber]) {
				acc[pageNumber] = [];
			}
			acc[pageNumber].push(problem);
			return acc;
		}, {});
	};
</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<br />
	<h1
		contenteditable={titleEditable}
		class:editable={titleEditable}
		on:click={() => {
			titleEditable = true;
		}}
		on:blur={async (e) => {
			await updateTitle(e);
		}}
		on:keypress={async (e) => {
			e.key == "Enter" && (await updateTitle(e));
		}}
	>
		{test.test_name}
	</h1>
	<div>
		Test Length (seconds):<br />
		<p
			contenteditable={lengthEditable}
			class:editable={lengthEditable}
			on:click={() => {
				lengthEditable = true;
			}}
			on:blur={async (e) => {
				await updateLength(e);
			}}
			on:keypress={async (e) => {
				e.key == "Enter" && (await updateLength(e));
			}}
		>
			{test.length}
		</p>
	</div>
	<div>
		Test Buffer (seconds):<br />
		<p
			contenteditable={bufferEditable}
			class:editable={bufferEditable}
			on:click={() => {
				bufferEditable = true;
			}}
			on:blur={async (e) => {
				await updateBuffer(e);
			}}
			on:keypress={async (e) => {
				e.key == "Enter" && (await updateBuffer(e));
			}}
		>
			{test.buffer_time}
		</p>
	</div>
	<br />
	<Button
		title="Save Changes"
		action={async () => {
			try {
				await saveTest();
			} catch (e) {
				await handleError(e);
			}
		}}
	/>
	<br />
	<div class="box box-basic">
		<p style="font-weight: bold; font-size: 24px;">Test Instructions</p>
		<div class="row">
			<div>
				<h4>Editable</h4>
				<TextArea
					class="textArea"
					bind:value={test.instructions}
					on:input={(e) => updateTestWithKey(e, "instructions")}
					required={true}
				/>
			</div>
			<div>
				<h4>Display</h4>
				<MathJax math={test.instructions} />
			</div>
		</div>
		<br />
	</div>
	<div class="box-basic">
		<p style="font-weight: bold; font-size: 24px;">Problem Rearrangement</p>
		<div>
			{#each Object.entries(groupByPageNumber(problems)) as [pageNumber, pageProblems]}
				<div class="page-container">
					<h4>Page {pageNumber}</h4>
					<br />
					{#each pageProblems as problem, index}
						<div class="container">
							<div class="row">
								<div>
									<h4>Editable</h4>
									<div class="arrows">
										<p style="margin: 0; padding: 0">
											ID: {problem.test_problem_id}
										</p>
										<button
											class="arrow-button"
											on:click={() => {
												modalProblem = index + 1;
											}}>🔁</button
										>
										<button
											class="arrow-button"
											on:click={() =>
												moveUp(
													problems.indexOf(problem),
												)}
											disabled={problems.indexOf(
												problem,
											) === 0}>⬆️</button
										>
										
										<button
											class="arrow-button"
											on:click={() =>
												moveDown(
													problems.indexOf(problem),
												)}
											disabled={problems.indexOf(
												problem,
											) ===
												problems.length - 1}>⬇️</button
										>

										<button
											class="arrow-button"
											on:click={async () => {
												await deleteTestProblem(problem.test_problem_id);

												problems.splice(index+1, 1);
    											problems = [...problems];

												for (let i = index + 1; i < problems.length; i++) {
													problems[index].problem_order -= 1;
												}

												await saveTest();
											}}>🗑️</button
										>
									</div>
									<br />
									<TextInput
										labelText="Name"
										bind:value={problem.name}
										on:blur={(e) =>
											updateProblemWithKey(
												e,
												"name",
												index,
											)}
									/>
									<br />
									<div class="row">
										<TextInput
											labelText="Page Number"
											bind:value={problem.page_number}
											on:blur={(e) =>
												updateProblemWithKey(
													e,
													"page_number",
													index,
												)}
										/>
										<TextInput
											labelText="Points"
											bind:value={problem.points}
											on:blur={(e) =>
												updateProblemWithKey(
													e,
													"points",
													index,
												)}
										/>
									</div>
									<br />
									<TextArea
										labelText="Problem Latex"
										bind:value={problem.problems
											.problem_latex}
										on:input={(e) =>
											updateProblemWithKey(
												e,
												"problems.problem_latex",
												index,
											)}
									/>
									<br />
									<TextInput
										labelText="Answer Latex"
										bind:value={problem.problems
											.answer_latex}
										on:blur={(e) =>
											updateProblemWithKey(
												e,
												"problems.answer_latex",
												index,
											)}
									/>
								</div>
								<div>
									<h4>Display</h4>
									<Problem {problem} />
									<br /><br />
									<Katex
										value={"ANSWER: " +
											problem.problems.answer_latex}
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<Modal
		open={modalProblem != null}
		modalHeading="Select Problem"
		primaryButtonText="Confirm"
		secondaryButtonText="Cancel"
		on:click:button--secondary={() => (modalProblem = null)}
		on:open
		on:close
		on:submit={() => (modalProblem = null)}
	>
		<Button
			title="Add New Problem"
			action={async () => {
				loading = true;

				const newProblem = { ...problems[problems.length - 1] };

				delete newProblem.test_problem_id;
				delete newProblem.problems;
				newProblem.problem_order += 1;

				const insertedProblem = await addNewTestProblem(newProblem, "*, problems(*)");
				problems.push(insertedProblem);

				await saveTest();
				
				modalProblem = null;
				loading = false;
			}}
		/>
		<br /><br />
		<Accordion>
			{#each allProblems as problem, index}
				<AccordionItem title="Problem ID: {problem.problem_id}">
					<div class="problem-details">
						<p>Problem:</p>
						<MathJax math={problem.problem_latex} />
						<br />
						<Button
							title="Select"
							action={async () => {
								const newProblem = await replaceTestProblem(problems[modalProblem].test_problem_id, problem.problem_id, "*, problems(*)");
								problems[modalProblem] = newProblem;
								problems = [...problems];

								modalProblem = null;
							}}
						/>
					</div>
				</AccordionItem>
			{/each}
		</Accordion>
	</Modal>
{/if}

<style>
	h1 {
		text-align: center;
		cursor: pointer;
	}

	h1.editable {
		border: 1px dashed #000000;
		outline: none;
	}

	.box {
		border: 1px solid black;
		padding: 10px;
	}

	.box-basic {
		margin: 20px;
		text-align: left;
	}

	.container {
		border: 1px dashed #000000;
		align-items: center;
		padding: 10px;
		margin-bottom: 10px;
	}

	.arrows {
		display: flex;
		align-items: center;
		margin-top: 7px;
	}

	.arrow-button {
		padding: 5px;
		cursor: pointer;
		width: 40px;
		margin-left: 10px;
	}

	button {
		border: none;
		outline: none;
		background-color: none;
	}

	.page-container {
		border: 1px solid #000;
		padding: 10px;
		margin-bottom: 20px;
	}

	.problem-details {
		width: 100%;
	}
</style>
