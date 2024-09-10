<script lang="ts">
	import { page } from '$app/stores';
	import Button from "$lib/components/Button.svelte";
	import { formatTime, formatDuration, addTime, subtractTime, isBefore, isAfter, diffBetweenDates } from "$lib/dateUtils";
	import Loading from "$lib/components/Loading.svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import { onDestroy, onMount } from "svelte";
	import {
		getThisUser,
        getEventTests,
		getTeamId,

    getTestTaker

	} from "$lib/supabase";

	let loading = true;

	let availableTests = [];
	let tests = [];
	let testStatusMap = {};
	let user = null;
	let teamId = null;

	(async () => {
		user = await getThisUser();
		teamId = await getTeamId(user.id);
		console.log("USER", user)
		await getTests();
		loading = false;
	})();

	const updateStatus = (test) => {
		const currentTime = new Date();
		const newStatus = {
			status: 'Closed',
			countdown: "",
			disabled: true
		}
		if (!test.opening_time || currentTime < new Date(test.opening_time)) {
			newStatus.status = 'Not Open'
			if (test.opening_time) {
				newStatus.countdown = "Time till test: " + formatDuration(diffBetweenDates(test.opening_time, currentTime, "seconds"))
			}
			
		}
		else if (!test.start_time && isAfter(addTime(new Date(test.opening_time), test.length + test.buffer_time, "seconds"), currentTime)) {
			newStatus.status = 'Start'
			newStatus.countdown = "Time remaining: " + formatDuration(Math.min(test.length, Math.abs(diffBetweenDates(currentTime, addTime(new Date(test.opening_time), test.length + test.buffer_time, "seconds"), "seconds"))))
			newStatus.disabled = false
		}
		else if (test.end_time && currentTime < new Date(test.end_time)) {
			newStatus.status = 'Continue'
			newStatus.disabled = false
		}
		testStatusMap[test.test_id] = newStatus
	};

	const interval = setInterval(() => {
      tests.forEach(updateStatus);
    }, 1000);


	async function getTests() {
		try {
			tests = await getEventTests($page.params.event_id)
			for (const test of tests) {
				const testTaker = await getTestTaker(test.test_id, test.is_team ? teamId : user.id, test.is_team)
				test.start_time = testTaker.start_time
				test.end_time = testTaker.end_time
				updateStatus(test)
			}
		} catch (error) {
			handleError(error);
			toast.error(error.message);
		}
	}
</script>

<br />
<h1>Tests</h1>
<br />
<div>
	{#if loading}
		<Loading />
	{:else if tests.length === 0}
		<p>No available tests!</p>
	{:else}
		<div class="buttonContainer">
			{#each tests as test}
				<div>
					<div
						class="problemContainer"
					>
						<h4>
							{test.test_name}
						</h4>
						<div style="margin-top: 10px">
							<Button
								href="./tests/{test.test_id}"
								title={testStatusMap[test.test_id].status}
								disabled={testStatusMap[test.test_id].disabled}
							/>
							
						</div>
						{testStatusMap[test.test_id].countdown}
					</div>
					
				</div>
			{/each}
			<Button
				href="."
				title={"Back"}
			/>
		</div>
		<br />
	{/if}
</div>

<style>
	.problemContainer {
		background-color: white;
		border: 3px solid var(--primary-tint);
		padding: 10px;
		margin: 10px;
		border-radius: 20px;
		text-align: center;
		font-weight: bold;
		text-decoration: none;
		display: block;
		color: var(--text-color-dark);
		transition: all 0.3s ease; /* Add transition for smooth hover effect */
	}

	.problemContainer:hover {
		transform: scale(1.05); /* Scale up on hover */
		border-width: 5px; /* Increase border width on hover */
	}

	.buttonContainer {
		flex-direction: column; /* Align children vertically */
		align-items: center; /* Center children horizontally */
		justify-content: center; /* Center children vertically */
		margin: 0 auto; /* Center the container horizontally on the page */
		width: 70%;
	}
</style>
