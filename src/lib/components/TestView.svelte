<script lang="js">
	import { onMount } from 'svelte';
	import {onDestroy} from 'svelte';
	import Button from "$lib/components/Button.svelte";
	import AsciiMath from "$lib/components/AsciiMath.svelte";
	import MathJax from "$lib/components/MathJax.svelte"
	import FormattedTimeLeft from "$lib/components/FormattedTimeLeft.svelte"
	import { Tooltip, TooltipIcon, TextInput, Dropdown, Modal } from "carbon-components-svelte";
	import Information from "carbon-icons-svelte/lib/Information.svelte";
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
	//console.log("TESTAKER", test_taker);
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
	let curPage = test_taker.page_number

	let test_answers_channel;
	let problem_clarifications_channel;
	let test_taker_channel;

	let currentField;
	let prevAnswer;

	let open = false;

	const changeProblemClarification = (payload) => {
		//console.log("CLARIFY", payload);
		clarifications[payload.new.test_problem_id] =
			payload.new.clarification_latex;
	};

	

	async function loadData() {
		loading = true;
		const startTime = performance.now()
		await Promise.all([
			fetchAnswers(),
			fetchProblems(),
		]);
		loading=false;
		const endTime = performance.now();
		console.log(`loadData took ${endTime - startTime} milliseconds`);
	}

	async function fetchAnswers() {
		answers = await getTestAnswers(test_taker.test_taker_id);
		answers.forEach((obj) => {
			answersMap[obj.test_problem_id] = obj.answer_latex;
			saved[obj.test_problem_id] = obj.answer_latex;
		});
	}


	async function fetchProblems() {
		try {
			problems = await fetchTestProblems(test_taker.test_taker_id);
			subscribeToChannels(),
			await Promise.all(problems.map(async (problem) => {
				if (!(problem.test_problem_id in answersMap)) {
					answersMap[problem.test_problem_id] = "";
				}
				const clarification = await getProblemClarification(problem.test_problem_id);
				if (clarification && clarification.length > 0) {
					clarifications[problem.test_problem_id] = clarification[0].clarification_latex;
				}
			}));
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}

	const handleAnswersUpsert = (payload) => {
		//console.log("UPSERT", payload);
		open = false;
		answersMap[payload.new.test_problem_id] = payload.new.answer_latex;
		saved[payload.new.test_problem_id] = payload.new.answer_latex;
	};

	

	async function subscribeToChannels() {
		if (problem_clarifications_channel) {
			problem_clarifications_channel.unsubscribe()
		}
		console.log("PROBS", problems)
		const problemIds = problems.map(problem => problem.test_problem_id).join(",")
		problem_clarifications_channel = supabase
			.channel("problem-clarification-for-test-" + test_taker.test_id + "-page-" + test_taker.page_number)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "problem_clarifications",
					filter: `test_problem_id=in.(${problemIds})`
				},
				changeProblemClarification,
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "problem_clarifications",
					filter: `test_problem_id=in.(${problemIds})`
				},
				changeProblemClarification,
			)
			.subscribe();
	}

	function handleFocus(event) {
		//console.log("EVENT", event)
		prevAnswer = event.target.value
        currentField = event.target;
    }

	// Create a function to handle inserts

	const handleTestTakerUpsert = async (payload) => {
		//console.log("TEST TAKER UPSERT", payload);
		open = false;
		test_taker.page_number = payload.new.page_number;
		await loadData();
	};

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

	test_answers_channel = supabase
		.channel("test-answers-for-taker-" + test_taker.test_taker_id + "-page-" + test_taker.page_number)
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				table: "test_answers",
				filter: `test_taker_id=eq.${test_taker.test_taker_id}`,
			},
			handleAnswersUpsert,
		)
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				table: "test_answers",
				filter: `test_taker_id=eq.${test_taker.test_taker_id}`,
			},
			handleAnswersUpsert,
		)
		.subscribe();

	function updateTimer() {
		if (!endTime) return;

		const now = new Date().getTime(); // Current time in milliseconds

		timeRemaining = endTimeMs - now; // Calculate the time difference
		timeElapsed = now - startTimeMs;
		// If time has passed, stop the timer
		if (timeRemaining <= 0 || now < startTimeMs) {
			console.log("OUT OF TIME")
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

	onDestroy(async () => {
		saveFinalAnswer();
		console.log("Destroying");
		if (test_answers_channel) {
			test_answers_channel.unsubscribe()
		}
		if (problem_clarifications_channel) {
			problem_clarifications_channel.unsubscribe()
		}
		if (test_taker_channel) {
			test_taker_channel.unsubscribe();
		}
		timerInterval ?? clearInterval(timerInterval);

	});

	

	async function handleContinue() {
		await changePage(test_taker.test_taker_id, curPage + 1);
		test_taker.page_number = curPage + 1;
		await loadData();
	}

	function sanitizeInput(input) {
		return input.trim();
	}

	async function changeAnswer(e, id) {
		try {
			//console.log("ANSWER CHANGE")
			const upsertSuccess = await upsertTestAnswer(test_taker.test_taker_id, id, answersMap[id].trim());
			//console.log("SUCCESSFUL UPSERT", upsertSuccess)
			if (upsertSuccess == 'Upsert succeeded') {
				saved[id] = answersMap[id]
			} else {
				answersMap[id]=prevAnswer
			}
		} catch (e) {
			handleError(e);
		}
	}

	(async () => {
		updateTimer()
		await loadData()
	})();
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
						{#if meltTime}
							<h5>
								<FormattedTimeLeft timeLeft={problem.problem_number*parseInt(meltTime) - timeElapsed/1000} totalTime={problem.problem_number*parseInt(meltTime)} let:prop={time}>
									{#if problem.problem_number*parseInt(meltTime) - timeElapsed/1000 < 0}
										Melted!
									{:else}
										Melts in {time}
									{/if}
								</FormattedTimeLeft>
							</h5>
						{/if}
						
						<Problem problem={problem} clarification={clarifications[problem.test_problem_id]} />
						<div style="margin-top: 30px; width: 300px;">
							<div style="display:flex; align-items: center;">
								<TextInput
									labelText="Answer"
									bind:value={answersMap[problem.test_problem_id]}
									disabled={meltTime ? problem.problem_number*parseInt(meltTime) - timeElapsed/1000 < 0 : false}
									on:focus={handleFocus}
									on:keydown={(e) => e.key === 'Enter' && changeAnswer(e, problem.test_problem_id)}
									on:blur={(e) =>
										changeAnswer(e, problem.test_problem_id)}
									maxLength={127}
								/>
								<TooltipIcon
									icon={Information}
									direction="top"
									style="margin-left: 8px; align-items: center; margin-top: 24px"
								>
									<p slot="tooltipText">
										Utilize <a href="https://asciimath.org/#syntax" style="color: #abdbe3"  target="_blank">AsciiMath</a> for math typesetting!
									</p>
								</TooltipIcon>
							</div>
							<br />
							<AsciiMath
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
					curPage = test_taker.page_number

				}}
					title={"Continue"}
				/>
			{/if}
		{/if}
	</div>
</div>
<div class="panel">
	<div style="display:flex align-items:center">
		
		<TooltipIcon tooltipText="Answers are automatically submitted when time runs out." icon={Information} direction="left" style="margin-right: 4px"/>
		<p>
			<FormattedTimeLeft timeLeft={timeRemaining/1000} totalTime={(endTimeMs - startTimeMs)/1000}>
				Time left: {formattedTime}
			</FormattedTimeLeft>
		</p> <!--Make tooltip in line with time remaining-->
	</div>
	
	{#if test_taker.page_number < pages.length}
		<Button action={(e) => {
			open = true;
			curPage = test_taker.page_number
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
