<script lang="js">
	import Latex from "$lib/components/Latex.svelte";
	import MathJax from "$lib/components/MathJax.svelte"
	import {
		Checkbox,
		TextArea,
		TextInput,
		Dropdown,
	} from "carbon-components-svelte";
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabaseClient";
	import { createEventDispatcher } from "svelte";
	import { formatTime } from "$lib/dateUtils";
	import { onDestroy, onMount } from "svelte";
	import Button from "$lib/components/Button.svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import {
		getTestProblems,
        getTestAnswers,
        upsertTestAnswer,
	} from "$lib/supabase";

	const dispatch = createEventDispatcher();

	export let test_taker;
    console.log("TESTAKER",test_taker)
    let answers = [];
    let problems = [];
	let answersMap = {};
    let loading = true;
	let startTime = test_taker.start_time
	let endTime = test_taker.end_time
	let formattedTime = "0:00:00";
	let timerInterval;

	(async () => {
		answers = await getTestAnswers(test_taker.test_taker_id);
		await fetchProblems();
		loading = false;
	})()

	// Create a function to handle inserts
	const handleAnswersUpsert = (payload) => {
		console.log("UPSERT", payload);
		answersMap[payload.new.test_problem_id] = payload.new.answer_latex;
	};

	// Listen to inserts
	supabase
		.channel("test-takers-" + test_taker.test_taker_id)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "test_answers",
				filter: "test_taker_id=eq." + test_taker.test_taker_id,
			},
			handleAnswersUpsert
		)
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "test_answers",
				filter: "test_taker_id=eq." + test_taker.test_taker_id,
			},
			handleAnswersUpsert
		)
		.subscribe();

	function updateTimer() {
		if (!endTime) return;

		const now = new Date().getTime(); // Current time in milliseconds
		const endTimeMs = new Date(endTime).getTime(); // Test end time in milliseconds

		let timeRemaining = endTimeMs - now; // Calculate the time difference

		// If time has passed, stop the timer
		if (timeRemaining <= 0) {
			timeRemaining = 0
			clearInterval(timerInterval);
			return;
		}

		// Format the time remaining using the provided formatTime function
		formattedTime = formatTime(timeRemaining, { showMilliseconds: false, hideHours: false });
	}
	timerInterval = setInterval(updateTimer, 1000)

    /**
	if (!reviewing) {
		timeElapsed = 0;
		if (!testsolve.startTime) {
			(async () => {
				updateTestsolve(testsolve.id, {
					start_time: startTime,
					time_elapsed: 0,
				});
			})();
		}
		console.log(testsolve);
		function updateTimer() {
			if (!startTime) return;
			timeElapsed =
				new Date().getTime() -
				startTime.getTime() +
				(testsolve.time_elapsed ? testsolve.time_elapsed : 0);
		}

		timerInterval = setInterval(updateTimer, 1000);
	} else {
		timeElapsed = testsolve.time_elapsed;
	}
    */

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
    

	onDestroy(async () => {
		console.log("Destroying");
		supabase.removeChannel("test-takers-" + test_taker.id);
		timerInterval ?? clearInterval(timerInterval);
	});
    
*/
	async function fetchProblems() {
		try {
			problems = await getTestProblems(test_taker.test_id, "*,problems(*)");
            console.log("PROBS",problems)
            console.log("ANS", answers)
			answers.forEach((obj) => {
				answersMap[obj.test_problem_id] = obj.answer_latex;
			});
			for (const problem of problems) {
				console.log("PROB", problem);
				if (!(problem.test_problem_id in answersMap)) {
					answersMap[problem.test_problem_id] = "";
				}
			}
            console.log(problems, answers, answersMap)
			loading = false;
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	function sanitizeInput(input) {
		return input.trim();
	}

    

	function changeAnswer(e, id) {
		upsertTestAnswer(test_taker.test_taker_id, id, answersMap[id]);
	}

	async function completeTest() {
		try {
			await updateTestsolve(testsolve.id, { time_elapsed: timeElapsed });
			dispatch("complete");
		} catch (error) {
			handleError(error);
			toast.error(error.message);
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
						<p>
							<span style="font-size: 30px;">
								{problem.problem_number}.
							</span>
						</p>
						<MathJax
							latex={problem.problems.problem_latex}
						/>
					</div>
					<div class="answer-div">
						<div style="margin-top: 10px;">
							<TextInput
								labelText="Answer"
								bind:value={answersMap[problem.test_problem_id]}
								on:blur={(e) => changeAnswer(e, problem.test_problem_id)}
							/>
							<MathJax
								latex={answersMap[problem.test_problem_id]}
							/>
							{answersMap[problem.test_problem_id]}
						</div>
					</div>
				</div>
			{/each}
		{/if}
		<br />
	</div>
</div>
    <div class="panel">
		<p>Time remaining: {formattedTime}</p>
	</div>

<style>
	.problem-container {
		display: flex;
	}

	.problem-div,
	.feedback-div {
		background-color: var(--text-color-light);
		border: 2px solid black;
		margin: 10px;
		padding: 20px;
		text-align: left;
		flex-grow: 1;
	}

	.problem-div {
		width: 60%;
	}

	.test-div {
		display: flex;
		justify-content: center;
		padding-bottom: 20px;
	}

	.inner-div {
		width: 80%;
		min-width: 400px;
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
