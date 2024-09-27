<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import {
		TextArea,
		TextInput,
		Accordion,
		AccordionItem,
		DataTable,
		Link,
		Toolbar,
		ToolbarContent,
		ToolbarSearch,
		Pagination,
	} from "carbon-components-svelte";
	import {} from "carbon-components-svelte";
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
		getAllProblemClarifications,
		updateProblemClarifications,
		updateTestProblem,
	} from "$lib/supabase";
	import Problem from "$lib/components/Problem.svelte";
	import Katex from "$lib/components/Katex.svelte";

	let loading = true;

	let titleEditable = false;
	let lengthEditable = false;
	let bufferEditable = false;
	let instructionsEditable = false;

	let pageSize = 25;
	let pageT = 1;

	let modalProblem: number | null = null;

	let test_id = Number($page.params.test_id);
	let is_team = $page.params.test_id.charAt(0) == "t" ? true : false;

	let user;
	let test;
	let problems;
	let test_taker;
	let clarifications;
	let allProblems;

	(async () => {
		user = await getThisUser();
		test = await getTest(test_id);
		problems = await getTestProblems(test_id, null, "*, problems(*)");
		allProblems = await getAllProblems();
		allProblems.forEach((problem) => {
			problem.id = problem.problem_id;
		});
		clarifications = await getAllProblemClarifications(problems);
		loading = false;
	})();

	// Function to move the problem up (and across pages if necessary)
	function moveUp(index) {
		if (index > 0) {
			const currentProblem = problems[index];
			const previousProblem = problems[index - 1];

			// Swap problem_number and page_number if on different pages
			if (currentProblem.page_number !== previousProblem.page_number) {
				const tempPageNumber = currentProblem.page_number;
				currentProblem.page_number = previousProblem.page_number;
				previousProblem.page_number = tempPageNumber;
			}

			// Swap problem_number
			[currentProblem.problem_number, previousProblem.problem_number] = [
				previousProblem.problem_number,
				currentProblem.problem_number,
			];

			// Swap positions in the array
			problems[index - 1] = currentProblem;
			problems[index] = previousProblem;

			// Resort problems after the swap
			problems.sort(
				(a, b) =>
					a.page_number - b.page_number ||
					a.problem_number - b.problem_number,
			);
		}
	}

	// Function to move the problem down (and across pages if necessary)
	function moveDown(index) {
		if (index < problems.length - 1) {
			const currentProblem = problems[index];
			const nextProblem = problems[index + 1];

			// Swap problem_number and page_number if on different pages
			if (currentProblem.page_number !== nextProblem.page_number) {
				const tempPageNumber = currentProblem.page_number;
				currentProblem.page_number = nextProblem.page_number;
				nextProblem.page_number = tempPageNumber;
			}

			// Swap problem_number
			[currentProblem.problem_number, nextProblem.problem_number] = [
				nextProblem.problem_number,
				currentProblem.problem_number,
			];

			// Swap positions in the array
			problems[index + 1] = currentProblem;
			problems[index] = nextProblem;

			// Resort problems after the swap
			problems.sort(
				(a, b) =>
					a.page_number - b.page_number ||
					a.problem_number - b.problem_number,
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

	async function updateTestWithKey(event, key, autoUpdate = false) {
		test[key] = event.target.value;
		if (autoUpdate) {
			await updateTest(test.test_id, test);
		}
	}

	async function saveTest() {
		try {
			await updateTest(test.test_id, test);
			await updateTestProblems(test.test_id, problems);
			clarifications = await updateProblemClarifications(clarifications);
			toast.success("Successfully saved");
		} catch (e) {
			handleError(e);
		}
	}

	async function addNewProblemPage() {
		test.settings.pages.push("Page " + (test.settings.pages.length + 1));
		await updateTest(test.test_id, test);
	}

	// Group problems by page_number
	const groupByPageNumber = (problems, totalPages) => {
		const grouped = Array.from({ length: totalPages }, () => []);

		problems.forEach((problem) => {
			const pageNumber = problem.page_number - 1;
			if (grouped[pageNumber]) {
				grouped[pageNumber].push(problem);
			} else {
				problem.pageNumber = 1;
				group[0].push(problem);
			}
		});

		return grouped;
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
	<Button title="Grade Test" href={$page.url.pathname + "/grade"} />
	<br /><br />
	<Button
		title="Save Test"
		action={async () => {
			await saveTest();
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
					on:input={(e) => updateTestWithKey(e, "instructions", true)}
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
			{#each groupByPageNumber(problems, test.settings.pages.length) as pageProblems, pageNumber}
				<div class="page-container">
					<div class="flex">
						<TextInput
							labelText="Page Title"
							bind:value={test.settings.pages[pageNumber]}
							style="width: 500px"
							on:blur={(e) => {
								test.settings.pages[pageNumber] =
									e.target.value;
							}}
						/>
						<button
							class="arrow-button"
							on:click={async () => {
								test.settings.pages.splice(pageNumber, 1);
								test = { ...test };
								await saveTest();
							}}>🗑️</button
						>
					</div>
					<br />
					{#each pageProblems as problem, index}
						<div class="container">
							<div class="row">
								<div>
									<h4>Editable</h4>
									<div class="arrows">
										<p style="margin: 0; padding: 0">
											ID: {problem.problems.problem_id}
										</p>
										<button
											class="arrow-button"
											on:click={() => {
												modalProblem = index;
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
												await deleteTestProblem(
													problem.test_problem_id,
												);

												problems.splice(index, 1);
												problems = [...problems];

												for (
													let i = index;
													i < problems.length;
													i++
												) {
													problems[
														index
													].problem_number -= 1;
												}

												await saveTest();
											}}>🗑️</button
										>
									</div>
									<br />
									<TextInput
										labelText="Name"
										bind:value={problem.name}
										on:blur={(e) => {
											problems[index]["name"] =
												e.target.value;
										}}
									/>
									<br />
									<div class="row">
										<TextInput
											labelText="Page Number"
											bind:value={problem.page_number}
											on:blur={(e) => {
												problems[index]["page_number"] =
													e.target.value;
											}}
										/>
										<TextInput
											labelText="Points"
											bind:value={problem.points}
											on:blur={(e) => {
												problems[index]["points"] =
													e.target.value;
											}}
										/>
									</div>
									<br />
									<TextArea
										labelText="Problem Latex"
										bind:value={problem.problems
											.problem_latex}
										on:input={(e) => {
											problems[index]["problems"][
												"problem_latex"
											] = e.target.value;
										}}
									/>
									<br />
									<TextArea
										labelText="Clarification Latex"
										bind:value={clarifications[
											problem.test_problem_id
										].clarification_latex}
										on:input={(e) => {
											clarifications[
												problem.test_problem_id
											].clarification_latex =
												e.target.value;
										}}
									/>
									<br />
									<TextInput
										labelText="Answer Latex"
										bind:value={problem.problems
											.answer_latex}
										on:blur={(e) => {
											problems[index]["problems"][
												"answer_latex"
											] = e.target.value;
										}}
									/>
									<br />
									<Button
										title="Save Changes"
										action={async () => {
											try {
												await updateTestProblem(
													test.test_id,
													problems[index],
												);
												toast.success("Saved problem");
											} catch (e) {
												await handleError(e);
											}
										}}
									/>
									<br />
								</div>
								<div>
									<h4>Display</h4>
									<Problem
										{problem}
										clarification={clarifications[
											problem.test_problem_id
										].clarification_latex}
									/>
									<br /><br />
									<MathJax
										math={"Answer: " +
											problem.problems.answer_latex}
									/>
								</div>
							</div>
						</div>
						<br />
					{/each}

					<br />
					<Button
						title="Add New Problem"
						action={async () => {
							loading = true;
							await addNewProblemPage(pageNumber + 1);
							loading = false;
						}}
					/>
					<br /><br />
				</div>
				<br />
			{/each}
			<Button
				title="Add New Page"
				action={async () => {
					loading = true;
					await addNewProblemPage(
						problems[problems.length - 1].page_number + 1,
					);
					loading = false;
				}}
			/>
			<br />
		</div>
	</div>

	{#if modalProblem != null}
		<div class="modal-overlay" on:click={() => (modalProblem = null)}>
			<div class="modal" on:click|stopPropagation>
				<button
					class="close-button"
					on:click={() => (modalProblem = null)}>✖</button
				>
				<h2>Select Problem</h2>
				<br />
				<Button title="Add New Problem" href="/admin/problems/new" />
				<br /><br />
				<DataTable
					expandable
					sortable
					size="compact"
					headers={[
						{ key: "edit", value: "Select", width: "50px" },
						{ key: "id", value: "ID", width: "50px" },
						{
							key: "problem_latex",
							value: "Problem Latex",
							width: "250px",
						},
					]}
					rows={allProblems}
					{pageSize}
					page={pageT}
				>
					<Toolbar size="sm">
						<ToolbarContent>
							<ToolbarSearch persistent shouldFilterRows />
						</ToolbarContent>
					</Toolbar>

					<svelte:fragment slot="cell" let:row let:cell let:rowIndex>
						<div>
							{#if cell.key === "edit"}
								<button
									class="arrow-button"
									on:click={async () => {
										const newProblem =
											await replaceTestProblem(
												problems[modalProblem]
													.test_problem_id,
												row.problem_id,
												"*, problems(*)",
											);
										problems[modalProblem] = newProblem;
										problems = [...problems];

										modalProblem = null;
									}}>✅</button
								>
							{:else}
								<div class="cell-content">
									{cell.value == null || cell.value == ""
										? "None"
										: cell.value}
								</div>
							{/if}
						</div>
					</svelte:fragment>

					<svelte:fragment slot="expanded-row" let:row>
						<MathJax math={row.problem_latex} />
					</svelte:fragment>
				</DataTable>

				<Pagination
					bind:pageSize
					bind:page={pageT}
					totalItems={allProblems.length}
					pageSizeInputDisabled
				/>
			</div>
		</div>
	{/if}
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
		border: 2px solid #000000;
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
		border: 3px solid var(--primary);
		padding: 10px;
		margin-bottom: 20px;
	}

	.cell-content {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background-color: white;
		padding: 20px;
		width: 600px;
		max-width: 90%;
		max-height: 500px;
		overflow-y: auto;
		border-radius: 8px;
		position: relative;
	}

	.close-button {
		position: absolute;
		top: 10px;
		right: 10px;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.problem-details {
		margin-top: 10px;
	}
</style>
