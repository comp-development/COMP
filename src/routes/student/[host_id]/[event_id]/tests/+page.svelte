<script lang="ts">
	import { page } from "$app/stores";
	import { onDestroy } from "svelte";
	import { Button, Badge, Modal } from 'flowbite-svelte';
	import { FileLinesSolid } from "flowbite-svelte-icons";
	import { writable } from "svelte/store";
	import {
		formatDuration,
		addTime,
		isAfter,
		diffBetweenDates,
	} from "$lib/dateUtils";
	import toast from "$lib/toast.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getEventTests,
		getTeamId,
		addTestTaker,
		getTestTaker,
	} from "$lib/supabase";
	import MathJax from "$lib/components/MathJax.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { supabase } from "$lib/supabaseClient";
  	import { user } from "$lib/sessionStore";

	let loading = $state(true);

	let open = $state(false);
	let instructions = $state("");
	let name = $state("");

	let currentTime;

	let availableTests = [];
	let testStatusMap = $state({});
	let tests = $derived(Object.values(testStatusMap));
	let teamId: number | null = null;
	let eventId = Number($page.params.event_id);

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
		teamId = await getTeamId($user!.id, eventId);
		console.log("teamId", teamId)
		await getTests();
		loading = false;

		// Listen to inserts
		subscription = supabase
			.channel("test-takers-" + teamId)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "test_takers",
					filter: "team_id=eq." + teamId,
				},
				handleTestTakerUpdate,
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "test_takers",
					filter: "student_id=eq." + teamId,
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
		let res;
		if (!test.start_time || !test.end_time) {
			res = await addTestTaker(test.test_id)
		}
		if (!res || res == "A test taker entry for this taker already exists" || res == "Inserted test_taker") {
			window.location.href = `./tests/${test.test_id}`;
		} else {
			toast.error(res)
		}
	}

	async function getTests() {
		try {
			const testList = await getEventTests($page.params.event_id) ?? [];
			for (const test of testList) {
				const testTaker = await getTestTaker(test.test_id, test.is_team ? teamId : $user!.id, test.is_team) ?? {};
				console.log("TAKER",testTaker, test)
				//test.start_time = testTaker ? testTaker.start_time : null
				//test.end_time = testTaker ? testTaker.end_time : null
				testStatusMap[test.test_id] = {...test, ...testTaker}
				updateStatus(test)
			}
		} catch (error) {
			handleError(error);
		}
	}
</script>

<br />
<h1 style="text-align: center;">Tests</h1>
<br />
<div>
	{#if loading}
		<Loading />
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
								<Badge rounded color="green"
									>{test.is_team ? "Team" : "Individual"}</Badge
								>
								{#if test.division}
									<Badge rounded color="green">{test.division}</Badge>
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
							<Button
								class="test-button full"
								disabled={test.disabled}
								onclick={async (e) => {
									e.preventDefault();
									await handleTestStart(test);
									window.location.href = `./tests/${test.test_id}`;
								}}
							>
								{test.status}
							</Button>
							<div class="tooltip-container">
								<Button
									pill
									outline
									class="!p-2"
									onclick={() => {
										open = true;
										instructions = test.instructions;
										name = test.test_name;
									}} 
									disabled={!test.instructions}
								>
									<FileLinesSolid class="w-6 h-6 text-primary-700" />
								</Button>
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