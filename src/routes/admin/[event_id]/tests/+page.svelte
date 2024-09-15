<script lang="ts">
	import { page } from '$app/stores';
	import Button from "$lib/components/Button.svelte";
	import { Modal, DatePicker, DatePickerInput, TimePicker, TimePickerSelect, SelectItem, TextInput } from "carbon-components-svelte";
	import { formatTime, formatDuration, addTime, subtractTime, isBefore, isAfter, diffBetweenDates } from "$lib/dateUtils";
	import Loading from "$lib/components/Loading.svelte";
	import toast from "svelte-french-toast";
	import { handleError } from "$lib/handleError";
	import { onDestroy, onMount } from "svelte";
	import {
		getThisUser,
        getEventTests,
		getTeamId,
		updateTest

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

	let curTest = {};

	let isInvalid = false

	function setupTime(date) {
		let month, day, year, hours, minutes, currentAmPm
		year = date.getFullYear();
		month = String(date.getMonth() + 1).padStart(2,'0'); // months are zero-indexed
		day = String(date.getDate()).padStart(2,'0');
		hours = date.getHours();
		currentAmPm = hours >= 12 ? 'pm' : 'am';
		hours = String((hours % 12) || 12 ).padStart(2, '0');
		minutes = String(date.getMinutes()).padStart(2, '0');
		curTest.date = `${month}/${day}/${year}`;
		curTest.time = `${hours}:${minutes}`;
		curTest.amPm = currentAmPm;
	}

	(async () => {
		user = await getThisUser();
		teamId = await getTeamId(user.id);
		console.log("USER", user)
		await getTests();
		console.log(testStatusMap)
		loading = false;
	})();

	const updateStatus = (test) => {
		const currentTime = new Date();
		test.status = 'Closed'
		test.countdown = ''
		if (!test.opening_time || currentTime < new Date(test.opening_time)) {
			test.status = 'Not Open'
			if (test.opening_time) {
				test.countdown = "Time till open: " + formatDuration(diffBetweenDates(test.opening_time, currentTime, "seconds"))
			}
		}
		else if (isAfter(addTime(new Date(test.opening_time), test.length + test.buffer_time, "seconds"), currentTime)) {
			test.status = 'Open'
			test.countdown = "Time remaining: " + formatDuration(Math.abs(diffBetweenDates(currentTime, addTime(new Date(test.opening_time), test.length + test.buffer_time, "seconds"), "seconds")))
		}
		testStatusMap[test.test_id] = test
	};

	const interval = setInterval(() => {
      tests.forEach(updateStatus);
    }, 1000);

	async function handleSubmit() {
		curTest.buffer_time = parseInt(curTest.buffer_time)
		let [hours, minutes] = curTest.time.split(':');
		if (curTest.amPm === 'pm' && hours !== '12') {
			hours = parseInt(hours) + 12;
		} else if (curTest.amPm === 'am' && hours === '12') {
		hours = '00'; // Handle midnight
		}

		const splitDate = curTest.date.split("/")
		console.log(splitDate)
		const year2 = splitDate[2];
		const month2 = splitDate[0]
		const day2 = splitDate[1]

		const dateTimeString = `${year2}-${month2}-${day2}T${hours}:${minutes}:00`;
		console.log(dateTimeString)
		const timestampz = new Date(dateTimeString).toISOString(); // Supabase expects ISO format for timestamptz
		console.log(timestampz)
		const data = {
			opening_time: timestampz,
			buffer_time: curTest.buffer_time
		}
		
		await updateTest(curTest.test_id, data)
		curTest.opening_time = timestampz
		console.log("CUR", curTest)
		console.log("TEST", testStatusMap[curTest.test_id])
		console.log(new Date(curTest.opening_time), curTest.length, curTest.buffer_time)
		console.log(addTime(new Date(curTest.opening_time), curTest.length + curTest.buffer_time, "seconds"))
		console.log(formatDuration(Math.abs(diffBetweenDates(new Date(), addTime(new Date(curTest.opening_time), curTest.length + curTest.buffer_time, "seconds"), "seconds"))))
	}

	function validateInput() {
		// Check if the value is a nonnegative integer using regex
		isInvalid = !/^\d+$/.test(curTest.buffer_time);
	}


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
								href="./tests/{test.test_id}"
								title="Edit Test & Problems"
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
									curTest = test
									setupTime(curTest.openingTime ? new Date(curTest.openingTime) : new Date())
									open = true;
								}}
								title={"Open Test"}
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
		<Modal 
			bind:open 
			modalHeading={name} 
			on:open 
			on:close 
			primaryButtonText="Save"
			secondaryButtonText="Cancel" 
			size="lg"
			on:click:button--secondary={() => (open = false)}
			on:submit = {async () => {
				open = false;
				await handleSubmit();
			}}
			
		>
            Set open time:
            <DatePicker bind:value={curTest.date} datePickerType="single" on:change>
                <DatePickerInput labelText="Meeting date" placeholder="mm/dd/yyyy" />
            </DatePicker>
            
            <TimePicker labelText="Time" placeholder="hh:mm" bind:value={curTest.time}>
                <TimePickerSelect bind:value={curTest.amPm}>
                    <SelectItem value="am" text="AM" />
                    <SelectItem value="pm" text="PM" />
                </TimePickerSelect>
            </TimePicker>

			<Button 
				action={() => {
					setupTime(new Date())
				}}
				title={"Now"}
			/>

			<TextInput
				labelText="Buffer Time (seconds)"
				bind:value={curTest.buffer_time}
				invalid={isInvalid}
				invalidText="Input must be a nonnegative integer"
				on:input={validateInput}
			/>


			<br><br><br><br><br><br><br><br><br><br><br><br><br><br>
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
