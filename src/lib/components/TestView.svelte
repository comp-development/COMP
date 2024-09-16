<script lang="js">
	import {onDestroy} from 'svelte';
	import Button from "$lib/components/Button.svelte";
	import Katex from "$lib/components/Katex.svelte";
	import MathJax from "$lib/components/MathJax.svelte"
	import { Tooltip, TextInput, Dropdown, Modal } from "carbon-components-svelte";
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabaseClient";
	import { createEventDispatcher } from "svelte";
	import { formatDuration } from "$lib/dateUtils";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import {
		getTestProblems,
		getTestAnswers,
		upsertTestAnswer,
		getProblemClarification,
		updateTest
	} from "$lib/supabase";
  import { mathlifier } from "mathlifier";

	export let test_taker;
	export let num_pages = 1;
	export let is_team = false;
	console.log("TESTAKER", test_taker);
	let answers = [];
	let problems = [];
	let answersMap = {};
	let clarifications = {};
	let saved = {};
	let loading = true;
	let startTime = test_taker.start_time;
	let endTime = test_taker.end_time;
	let formattedTime = "0:00:00";
	let timerInterval;

	let open = false;

	(async () => {
		answers = await getTestAnswers(test_taker.test_taker_id);
		answers.forEach((obj) => {
			answersMap[obj.test_problem_id] = obj.answer_latex;
			saved[obj.test_problem_id] = obj.answer_latex;
		});
		await fetchProblems();
	})();

	// Create a function to handle inserts
	const handleAnswersUpsert = (payload) => {
		console.log("UPSERT", payload);
		answersMap[payload.new.test_problem_id] = payload.new.answer_latex;
		saved[payload.new.test_problem_id] = payload.new.answer_latex;
	};

	const changeProblemClarification = (payload) => {
		console.log("CLARIFY", payload);
		clarifications[payload.new.test_problem_id] =
			payload.new.clarification_latex;
	};

	let test_answers_channel;
	let problem_clarifications_channel;

	// Listen to inserts if team test
	if (is_team) {
		test_answers_channel = supabase
		.channel("test-takers-" + test_taker.test_taker_id)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "test_answers",
				filter: "test_taker_id=eq." + test_taker.test_taker_id,
			},
			handleAnswersUpsert,
		)
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "test_answers",
				filter: "test_taker_id=eq." + test_taker.test_taker_id,
			},
			handleAnswersUpsert,
		)
		.subscribe();
	}
	

	function subscribeToChannels() {
		if (problem_clarifications_channel) {
			problem_clarifications_channel.unsubscribe()
		}
		problem_clarifications_channel = supabase
			.channel("problem-clarification-for-test-" + test_taker.test_id + "-page-" + test_taker.page_number)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "problem_clarifications",
					filter: `test_problem_id=in.(${problems.map(problem => problem.test_problem_id)})`
				},
				changeProblemClarification,
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "problem_clarifications",
					filter: `test_problem_id=in.(${problems.map(problem => problem.test_problem_id)})`
				},
				changeProblemClarification,
			)
			.subscribe();
	}

	

	function updateTimer() {
		if (!endTime) return;

		const now = new Date().getTime(); // Current time in milliseconds
		const endTimeMs = new Date(endTime).getTime(); // Test end time in milliseconds

		let timeRemaining = endTimeMs - now; // Calculate the time difference
		// If time has passed, stop the timer
		if (timeRemaining <= 0) {
			timeRemaining = 0;
			clearInterval(timerInterval);
			return;
		}

		// Format the time remaining using the provided formatTime function
		formattedTime = formatDuration(timeRemaining/1000)
	}
	timerInterval = setInterval(updateTimer, 1000);

	/**
	onMount(() => {
		// Handle beforeunload event
		window.addEventListener("beforeunload", async () => {
			await updateTestsolve(testsolve.id, { time_elapsed: timeElapsed });
			final = [];
			for (const [id, item] of Object.entries(problemFeedbackMap)) {
				final.push({ ...item, problem_id: id, testsolve_id: testsolve.id });
			}
			console.log("FEEDBACK", final[0]);
			await upsertProblemFeedback(final);
		});
	});
     */

	onDestroy(async () => {
		console.log("Destroying");
		if (test_answers_channel) {
			test_answers_channel.unsubscribe()
		}
		if (problem_clarifications_channel) {
			problem_clarifications_channel.unsubscribe()
		}
		timerInterval ?? clearInterval(timerInterval);
	});


	async function fetchProblems() {
		try {
			loading = true
			problems = await getTestProblems(
				test_taker.test_id,
				test_taker.page_number,
				"*,problems(*)",
			);
			subscribeToChannels();
			console.log("PROBS", problems);
			console.log("ANS", answers);
			for (const problem of problems) {
				console.log("PROB", problem);
				if (!(problem.test_problem_id in answersMap)) {
					answersMap[problem.test_problem_id] = "";
				}

				const clarification = await getProblemClarification(
					problem.test_problem_id,
				);
				if (clarification && clarification.length > 0) {
					clarifications[problem.test_problem_id] =
						clarification[0].clarification_latex;
				}
			}
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	async function handleContinue() {
		test_taker.page_number += 1
		await fetchProblems();
	}

	function sanitizeInput(input) {
		return input.trim();
	}

	async function changeAnswer(e, id) {
		try {
			console.log("HELLO", id, answersMap[id])
			const data = await upsertTestAnswer(test_taker.test_taker_id, id, answersMap[id]);
			saved[id] = answersMap[id];
		} catch (e) {
			handleError(e);
		}
	}

	async function submitTest() {
		try {
			console.log("DISPATCHING");
			dispatch("submit");
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}
</script>

<div class="test-div">
	<div class="inner-div">
		{#if loading}
			<p>Loading...</p>
		{:else}
			<br />
			{#each problems as problem}
				<div class="problem-container">
					<div class="problem-div">
						<p style="margin-bottom: 5px;">
							<span style="font-size: 20px; font-weight: bold;">
								Problem {problem.problem_number}
							</span>
						</p>
						<br />
						<MathJax math={problem.problems.problem_latex} />
						{#if clarifications[problem.test_problem_id]}
							<br />
							<div class="clarification">
								<p>
									<span style="font-weight: bold; color: var(--error-dark); padding: 10px;">!</span>
									<span style="display: inline-block; vertical-align: middle;">
										<MathJax math={clarifications[problem.test_problem_id]}/>
									</span>
								</p>
							</div>
						{/if}
						<div style="margin-top: 30px; width: 300px;">
							<TextInput
								labelText="Answer"
								bind:value={answersMap[problem.test_problem_id]}
								on:keydown={(e) => e.key === 'Enter' && changeAnswer(e, problem.test_problem_id)}
								on:blur={(e) =>
									changeAnswer(e, problem.test_problem_id)}
							/>
							<br />
							<Katex
								value={answersMap[problem.test_problem_id]}
							/>
							{#if saved[problem.test_problem_id]}
								<br />
								<p
									style="color: green; margin-bottom: 0; font-size: 12px;"
								>
									Saved {saved[problem.test_problem_id]}
								</p>
							{/if}
						</div>
						<br />
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
<div class="panel">
	<p>Time remaining: {formattedTime}</p> <!--Make tooltip in line with time remaining-->
	<Tooltip>
		<p>Answers are automatically submitted when time runs out.</p>
	</Tooltip>
	{#if test_taker.page_number < num_pages}
		<Button action={(e) => {
			open = true;
		}}
			title={"Continue"}
		/>
	{:else}
		
	{/if}
</div>

<Modal 
	bind:open 
	modalHeading={"Submit Current Set?"} 
	on:open 
	on:close 
	primaryButtonText="Submit"
	secondaryButtonText="Cancel" 
	size="sm"
	on:click:button--secondary={() => (open = false)}
	on:submit = {async () => {
		open = false;
		await handleContinue();
	}}
>
	<p>Are you sure you want to submit the current set{#if is_team} for your team{/if}? This action cannot be undone.</p>
</Modal>

<style>
	.problem-container {
		display: flex;
	}
	.problem-div,
	.feedback-div {
		background-color: var(--text-color-light);
		border: 2px solid rgb(104, 104, 104);
		margin: 10px;
		padding: 20px;
		text-align: left;
		flex-grow: 1;
	}

	.test-div {
		display: flex;
		justify-content: center;
		padding-bottom: 20px;
	}

	.inner-div {
		width: 100%;
	}

	.clarification {
		border: 2px solid var(--error-light);
		background-color: var(--error-tint);
		padding: 10px;
	}

	.questionsDiv {
		background-color: var(--text-color-light);
		border: 2px solid black;
		padding: 20px;
		text-align: left;
		width: 70%;
	}

	.panel {
		position: fixed;
		right: 0;
		top: 0;
		margin: 10px;
		padding: 10px;
		background-color: var(--text-color-light);
		border: 1px solid black;
	}
</style>
