<script lang="js">
	import {onDestroy} from 'svelte';
	import Button from "$lib/components/Button.svelte";
	import Katex from "$lib/components/Katex.svelte";
	import MathJax from "$lib/components/MathJax.svelte"
	import FormattedTimeLeft from "$lib/components/FormattedTimeLeft.svelte"
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
		changePage,

    fetchTestProblems

	} from "$lib/supabase";
  import { mathlifier } from "mathlifier";
    import Problem from './Problem.svelte';

	export let test_taker;
	export let settings;
	let pages = settings.pages
	let meltTime = settings.meltTime
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
	let timeRemaining;
	let timeElapsed;
	let timerInterval;
	let endTimeMs = new Date(endTime).getTime(); // Test end time in milliseconds
	let startTimeMs = new Date(startTime).getTime();

	let currentField;
	let prevAnswer;

	let open = false;

	(async () => {
		updateTimer()
		answers = await getTestAnswers(test_taker.test_taker_id);
		answers.forEach((obj) => {
			answersMap[obj.test_problem_id] = obj.answer_latex;
			saved[obj.test_problem_id] = obj.answer_latex;
		});
		await fetchProblems();
	})();

	function handleFocus(event) {
		console.log("EVENT", event)
		prevAnswer = event.target.value
        currentField = event.target;
    }

	// Create a function to handle inserts
	const handleAnswersUpsert = (payload) => {
		console.log("UPSERT", payload);
		answersMap[payload.new.test_problem_id] = payload.new.answer_latex;
		saved[payload.new.test_problem_id] = payload.new.answer_latex;
	};

	const handleTestTakerUpsert = (payload) => {
		console.log("TEST TAKER UPSERT", payload);
		open = false;
		test_taker.page_number = payload.new.page_number;
		fetchProblems();
	};

	const changeProblemClarification = (payload) => {
		console.log("CLARIFY", payload);
		clarifications[payload.new.test_problem_id] =
			payload.new.clarification_latex;
	};

	let test_answers_channel;
	let problem_clarifications_channel;
	let test_taker_channel;

	// Listen to inserts if team test
	test_answers_channel = supabase
	.channel("test-answers-for-taker-" + test_taker.test_taker_id)
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

	test_taker_channel = supabase
	.channel("test-takers-" + test_taker.test_taker_id)
	.on(
		"postgres_changes",
		{
			event: "UPDATE",
			schema: "public",
			table: "test_takers",
			filter: "test_taker_id=eq." + test_taker.test_taker_id,
		},
		handleTestTakerUpsert,
	)
	.subscribe();
	

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

		timeRemaining = endTimeMs - now; // Calculate the time difference
		timeElapsed = now - startTimeMs;
		// If time has passed, stop the timer
		if (timeRemaining <= 0 || now < startTimeMs) {
			timeRemaining = 0;
			saveFinalAnswer();
			clearInterval(timerInterval);
			window.location.href = './'
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

	function saveFinalAnswer() {
		console.log("Saving")
        if (currentField) {
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });

            currentField.dispatchEvent(event);
        }
    }

	function waitForFiveSeconds() {
		return new Promise(resolve => setTimeout(resolve, 5000)); // 5000 milliseconds = 5 seconds
	}

	onDestroy(async () => {
		saveFinalAnswer();
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
			loading = true;
			problems = await fetchTestProblems(test_taker.test_taker_id)
			console.log("PROBLEMS",problems)
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
		const newPage = test_taker.page_number + 1;
		console.log("PAGE CHANGE")
		await changePage(test_taker.test_taker_id, newPage);
		test_taker.page_number = newPage;
		await fetchProblems();
	}

	function sanitizeInput(input) {
		return input.trim();
	}

	async function changeAnswer(e, id) {
		try {
			console.log("ANSWER CHANGE")
			const upsertSuccess = await upsertTestAnswer(test_taker.test_taker_id, id, answersMap[id]);
			console.log("SUCCESSFUL UPSERT", upsertSuccess)
			if (upsertSuccess == 'Upsert succeeded') {
				saved[id] = answersMap[id]
			} else {
				answersMap[id]=prevAnswer
			}
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
			<h2>{pages[test_taker.page_number - 1]}</h2>
			{#each problems as problem}
				<div class="problem-container">
					<div class="problem-div">
						<h5>
							{#if meltTime}
								<FormattedTimeLeft timeLeft={problem.problem_number*parseInt(meltTime) - timeElapsed/1000} totalTime={problem.problem_number*parseInt(meltTime)}>
									{#if problem.problem_number*parseInt(meltTime) - timeElapsed/1000 < 0}
										Melted!
									{:else}
										Melts in {formattedTime}
									{/if}
								</FormattedTimeLeft>
								
							{/if}
						</h5>
						<Problem problem={problem} clarification={clarifications[problem.test_problem_id]} />
						<div style="margin-top: 30px; width: 300px;">
							<TextInput
								labelText="Answer"
								bind:value={answersMap[problem.test_problem_id]}
								disabled={problem.problem_number*parseInt(meltTime) - timeElapsed/1000 < 0}
								on:focus={handleFocus}
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
			{#if test_taker.page_number < pages.length}
				<Button action={(e) => {
					open = true;
				}}
					title={"Continue"}
				/>
			{/if}
		{/if}
	</div>
</div>
<div class="panel">
	<p>
		<FormattedTimeLeft timeLeft={timeRemaining/1000} totalTime={(endTimeMs - startTimeMs)/1000}>
			Time left: {formattedTime}
		</FormattedTimeLeft>
	</p> <!--Make tooltip in line with time remaining-->
	<Tooltip>
		<p>Answers are automatically submitted when time runs out.</p>
	</Tooltip>
	{#if test_taker.page_number < pages.length}
		<Button action={(e) => {
			open = true;
		}}
			title={"Continue"}
		/>
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
