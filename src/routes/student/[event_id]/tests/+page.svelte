<script lang="ts">
	import { page } from "$app/stores";
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

	let availableTests = [];
	let testStatusMap = {};
	$: tests = Object.values(testStatusMap);
	let user = null;
	let teamId = null;

	const handleTestTimeUpdate = (payload) => {
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
		supabase
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
				handleTestTimeUpdate,
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "tests",
				},
				handleTestTimeUpdate,
			)
			.subscribe();
	})();

	const updateStatus = (test) => {
		const currentTime = new Date();
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
		else if (!test.opening_time || currentTime < new Date(test.opening_time)) {
			newStatus.status = "Not Open";
			if (test.opening_time) {
				newStatus.countdown =
					"Time till test: " +
					formatDuration(
						diffBetweenDates(
							test.opening_time,
							currentTime,
							"seconds",
						),
					);
			}
		} else if (
			isAfter(
				addTime(
					new Date(test.opening_time),
					test.length + test.buffer_time,
					"seconds",
				),
				currentTime,
			)
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
			{#each tests as test}
				<div>
					<div class="problemContainer">
						<div>
							<div class="flex" style="align-items: center;">
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
							<p>Duration: {test.length / 60} mins</p>
						</div>
						<div class="flex">
							<p style="margin-right: 10px;">
								{testStatusMap[test.test_id].countdown}
							</p>
							<button
								disabled={testStatusMap[test.test_id].disabled}
								on:click={async (e) => {
									e.preventDefault();
									await handleTestStart(test);
									window.location.href = `./tests/${test.test_id}`;
								}}
							>
								{testStatusMap[test.test_id].status}
							</button>
							<SvelteButton
								kind="ghost"
								iconDescription="Instructions"
								icon={Document}
								on:click={() => {
									open = true;
									instructions = test.instructions ?? "No Instructions Added";
									name = test.test_name;
								}}
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
		<br />
		<Modal passiveModal bind:open modalHeading={name} on:open on:close>
			<MathJax math={instructions} />
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
		outline: none;
		border: none;
		padding: 10px 30px;
		border-radius: 10px;
		background-color: #a7f0ba;
	}

	button:disabled,
	button[disabled] {
		cursor: not-allowed;
	}

	.problemContainer button:not([disabled]):hover {
		transform: scale(1.05);
		border: 2px solid #3f9656;
		background-color: #a7f0ba;
		cursor: pointer;
	}

	

	.buttonContainer {
		flex-direction: column; /* Align children vertically */
		align-items: center; /* Center children horizontally */
		justify-content: center; /* Center children vertically */
		margin: 0 auto; /* Center the container horizontally on the page */
		width: 70%;
	}
</style>
