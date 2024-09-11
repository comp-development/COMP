<script lang="ts">
	import { page } from '$app/stores';
	import Button from "$lib/components/Button.svelte";
	import { Modal, DatePicker, DatePickerInput, TimePicker, TimePickerSelect, SelectItem } from "carbon-components-svelte";
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

	let open = false;
	let instructions = ""
	let name = ""

	let availableTests = [];
	let tests = [];
	let testStatusMap = {};
	let user = null;
	let teamId = null;

    let date = '';
    let time = '';
    let amPm = 'pm';
    let timestampz = '';

    let now = new Date();
    console.log(now)
    let year = now.getFullYear();
    console.log(year)
    let month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    console.log(month)
    let day = String(now.getDate()).padStart(2, '0');
    console.log(day)
    let hours = String((now.getHours() % 12) || 12 ).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let currentAmPm = now.getHours() >= 12 ? 'pm' : 'am';

    // Set default date and time
    date = `${month}-${day}-${year}`;
    console.log(date)
    time = `${hours}:${minutes}`;
    amPm = currentAmPm;

	(async () => {
		user = await getThisUser();
		teamId = await getTeamId(user.id);
		console.log("USER", user)
		await getTests();
		loading = false;
	})();

    function getUserTimeZone() {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(userTimeZone)
        const ret = timeZones.find(zone => zone.tzName === userTimeZone) || timeZones[0]; // Default to UTC if not found
        console.log(ret)
        return ret
    }

	const updateStatus = (test) => {
		const currentTime = new Date();
		const newStatus = {
			status: 'Closed',
			countdown: "",
		}
		if (!test.opening_time || currentTime < new Date(test.opening_time)) {
			newStatus.status = 'Not Open'
			if (test.opening_time) {
				newStatus.countdown = "Time till open: " + formatDuration(diffBetweenDates(test.opening_time, currentTime, "seconds"))
			}
		}
		else if (isAfter(addTime(new Date(test.opening_time), test.length + test.buffer_time, "seconds"), currentTime)) {
			newStatus.status = 'Open'
			newStatus.countdown = "Time remaining: " + formatDuration(Math.abs(diffBetweenDates(currentTime, addTime(new Date(test.opening_time), test.length + test.buffer_time, "seconds"), "seconds")))
		}
		testStatusMap[test.test_id] = {...testStatusMap[test.test_id], ...newStatus}
	};

	const interval = setInterval(() => {
      tests.forEach(updateStatus);
    }, 1000);


	async function getTests() {
		try {
			tests = await getEventTests($page.params.event_id)
			console.log(tests)
			for (const test of tests) {
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
								href="./tests/{test.test_id}/edit"
								title="Problems"
							/>
							<Button
								href="./tests/{test.test_id}/grade"
								title="Grade Test"
							/>
							<Button
								href="./tests/{test.test_id}/results"
								title="Results"
							/>
							<Button action={(e) => {
									open = true;
									instructions = test.instructions
									name = test.test_name
								}}
								title={"Settings"}
							/>
							
						</div>
                        {testStatusMap[test.test_id].status}
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
		<Modal bind:open modalHeading={name} on:open on:close>
            Set open time:
            <DatePicker bind:value={date} datePickerType="single" on:change>
                <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
            </DatePicker>
            
            <TimePicker labelText="Time" placeholder="hh:mm" bind:value={time}>
                <TimePickerSelect bind:value={amPm}>
                    <SelectItem value="am" text="AM" />
                    <SelectItem value="pm" text="PM" />
                </TimePickerSelect>
            </TimePicker>

			{instructions}
		</Modal>
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
