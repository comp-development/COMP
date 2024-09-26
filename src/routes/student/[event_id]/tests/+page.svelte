<script lang="ts">
	import { page } from "$app/stores";
	import { onDestroy } from "svelte";
	import Button from "$lib/components/Button.svelte";
	import { Button as SvelteButton } from "carbon-components-svelte";
	import Document from "carbon-icons-svelte/lib/Document.svelte";
	
	import { Modal, Tag } from "carbon-components-svelte";
	import { writable } from "svelte/store";
	import {
		formatDuration,
		addTime,
		isAfter,
		diffBetweenDates,
	} from "$lib/dateUtils";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getEventTests,
		getTeamId,
		addTestTaker,
		getTestTaker,
	} from "$lib/supabase";
	import MathJax from "$lib/components/MathJax.svelte";
	import { supabase } from "$lib/supabaseClient";

	let loading = true;

	let open = false;
	let instructions = "";
	let name = "";

	let currentTime;

	let availableTests = [];
	let testStatusMap = {};
	$: tests = Object.values(testStatusMap);
	let user = null;
	let teamId = null;

	let subscription;

	const handleTestUpdate = (payload) => {
		console.log("TIME PAYLOAD", payload.new);
		testStatusMap[payload.new.test_id] = {...testStatusMap[payload.new.test_id], ...payload.new}
		return
	};

	const handleTestTakerUpdate = (payload) => {
		console.log("TAKER PAYLOAD", payload.new);
		testStatusMap[payload.new.test_id] = {...testStatusMap[payload.new.test_id], ...payload.new}
	};

	(async () => {
		user = await getThisUser();
		teamId = await getTeamId(user.id);
		console.log("USER", user);
		await getTests();
		loading = false;

		// Listen to inserts
		subscription = supabase
			.channel("test-takers-" + (user ? user.id : ""))
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "test_takers",
					filter: "student_id=eq." + (user ? user.id : ""),
				},
				handleTestTakerUpdate,
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "test_takers",
					filter: "student_id=eq." + (user ? user.id : ""),
				},
				handleTestTakerUpdate,
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "tests",
				},
				handleTestUpdate,
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "tests",
				},
				handleTestUpdate,
			)
			.subscribe();
	})();

	onDestroy(async () => {
		subscription ??	subscription.unsubscribe();
		interval ?? clearInterval(interval);
	})

	const updateStatus = (test) => {
		currentTime = new Date();
		const newStatus = {
			status: "Closed",
			countdown: "",
			disabled: true,
		};

		if (test.start_time && test.end_time && currentTime < new Date(test.end_time) && currentTime > new Date(test.start_time)) {
			newStatus.status = 'Continue'
			newStatus.disabled = false
			newStatus.countdown =
				"Time remaining: " +
				formatDuration(
						Math.abs(
							diffBetweenDates(
								currentTime,
								new Date(test.end_time),
								"seconds",
							),
						),
				);
		}
		else if (!test.end_time && (!test.opening_time || currentTime < new Date(test.opening_time))) {
			newStatus.status = "Not Open";
			const timeTillTest = diffBetweenDates(test.opening_time, currentTime, "seconds") 
			
			if (test.opening_time && timeTillTest < 86400) {
				newStatus.countdown = "Time till test: " + formatDuration(timeTillTest)
			}
		} else if (
			isAfter(
				addTime(
					new Date(test.opening_time),
					test.length + test.buffer_time,
					"seconds",
				),
				currentTime,
			) && !test.start_time
		) {
			newStatus.status = "Start";
			newStatus.countdown =
				"Time remaining: " +
				formatDuration(
					Math.min(
						test.length,
						Math.abs(
							diffBetweenDates(
								currentTime,
								addTime(
									new Date(test.opening_time),
									test.length + test.buffer_time,
									"seconds",
								),
								"seconds",
							),
						),
					),
				);
			newStatus.disabled = false;
		} 
		testStatusMap[test.test_id] = {...testStatusMap[test.test_id], ...newStatus}
		
	};

	const interval = setInterval(() => {
		Object.values(testStatusMap).forEach(updateStatus);
	}, 1000);

	async function handleTestStart(test) {
		console.log("START TEST", test);
		console.log("")
		if (!test.start_time || !test.end_time) {
			await addTestTaker(test.test_id)
		}
	}

	async function getTests() {
		try {
			const testList = await getEventTests($page.params.event_id);
			for (const test of testList) {
				const testTaker = await getTestTaker(test.test_id, test.is_team ? teamId : user.id, test.is_team) ?? {};
				console.log("TAKER",testTaker, test)
				//test.start_time = testTaker ? testTaker.start_time : null
				//test.end_time = testTaker ? testTaker.end_time : null
				testStatusMap[test.test_id] = {...test, ...testTaker}
				updateStatus(test)
			}
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}
</script>

<br />
<h1 style="text-align: center;">Tests</h1>
<br />
<div class="flex">
	<Button href="." title={"Back"} />
</div>
<br />
<div>
	{#if loading}
		<p>Loading...</p>
	{:else if tests.length === 0}
		<p>No available tests!</p>
	{:else}
		<div class="buttonContainer">
			{#each Object.values(testStatusMap).sort((a, b) => {
				// Sort by status priority first
				const statusOrder = { "Continue": 1, "Start": 2, "Not Open": 3, "Closed": 4 };
				const statusComparison = statusOrder[a.status] - statusOrder[b.status];
				if (statusComparison !== 0) return statusComparison;

				// Then sort by opening_time
				return (new Date(a.opening_time) - new Date(b.opening_time));
			}) as test}
				<div>
					<div class="problemContainer">
						<div>
							<div class="flex" style="align-items: center; justify-content: left;">
								<h4>
									{test.test_name}
								</h4>
								<Tag type="green"
									>{test.is_team ? "Team" : "Individual"}</Tag
								>
								{#if test.division}
									<Tag type="green">{test.division}</Tag>
								{/if}
							</div>
							{#if (test.status == "Not Open" && test.opening_time)}
								<p>
									Start Time: {new Date(
										test.opening_time,
									).toLocaleString([], {
										year: "numeric",
										month: "numeric",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							{/if}
							<p style="text-align: left;">Duration: {test.length / 60} mins</p>
						</div>
						<div class="flex" style="gap: 5px">
							<p style="margin-right: 5px;">
								{test.countdown}
							</p>
							<button
								class="test-button full"
								disabled={test.disabled}
								on:click={async (e) => {
									e.preventDefault();
									await handleTestStart(test);
									window.location.href = `./tests/${test.test_id}`;
								}}
							>
								{test.status}
							</button>
							<div class="tooltip-container">
								<button
									class="test-button empty"
									on:click={() => {
										open = true;
										instructions = test.instructions;
										name = test.test_name;
									}} 
									disabled={!test.instructions}
								>
									<Document/>
								</button>
								<span class="tooltip">{#if test.instructions}View Instructions{:else}No Instructions{/if}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<br />
		<Modal passiveModal bind:open modalHeading={name} on:open on:close>
			<div style="text-align:left"><MathJax math={instructions} /></div>
			
		</Modal>
	{/if}
</div>

<style>

	.problemContainer {
		background-color: white;
		border: 3px solid var(--primary-tint);
		padding: 20px;
		margin: 10px;
		border-radius: 20px;
		font-weight: bold;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: var(--text-color-dark);
		transition: all 0.3s ease; /* Add transition for smooth hover effect */
	}

	.problemContainer h4 {
		font-weight: bold;
		margin-right: 5px;
	}

	.problemContainer button {
		border: none;
	}

	.test-button {
		border-radius: 10px;
		border: 1px solid #a7f0ba;
	}

	.full {
		background-color: #a7f0ba;
		padding: 10px 20px;
	}

	.empty {
		padding: 10px 10px;
	}


	button:disabled,
	button[disabled] {
		cursor: not-allowed;
	}

	.test-button:not([disabled]):hover {
		transform: scale(1.05);
		cursor: pointer;
	}

	.full:not([disabled]):hover {
		border: 2px solid #3f9656;
	}

	.empty:not([disabled]):hover {
		border: 2px solid #494949;
	}

	

	.buttonContainer {
		flex-direction: column; /* Align children vertically */
		align-items: center; /* Center children horizontally */
		justify-content: center; /* Center children vertically */
		margin: 0 auto; /* Center the container horizontally on the page */
		width: 70%;
	}
</style>
