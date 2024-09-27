<script lang="ts">
	import { onMount } from "svelte";
	import { getGradedTestAnswers, getTestTakers } from "$lib/supabase/";
    import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
    import CloseLarge from "carbon-icons-svelte/lib/CloseLarge.svelte";

	export let test;
    let testTakersMap = {};

	onMount(async () => {
		await fetchTestTakers();
		await updateTable();
		setInterval(updateTable, 5000);
	});

	async function fetchTestTakers() {
		const testTakers = await getTestTakers(test.test_id, true);
        testTakers.forEach((obj) => {
			testTakersMap[obj.test_taker_id] = obj;
		});
        console.log("testTakers", testTakersMap)
	}

	async function updateTable() {
		const data = await getGradedTestAnswers(test.test_id);

        data.forEach((obj) => {
			testTakersMap[obj.test_taker_id][obj.test_problem_number] = {...obj};
		});
	}

	function getCellValue(entry) {
		if (!entry) return {style: 'color:#a7a7a7; background-color:white', value:'—'};
		if (entry.correct === null) return {style: 'color:#eebc69; background-color:#f8ebcc', value:'?'};
		return entry.correct ? {style: 'color:#5f974a; background-color:#d3f4d8', value:'✓'} : {style: 'color:#e45e52; background-color:#f4d8d8', value:'✗'};
	}
</script>

<div>
	<h2 style="text-align: center">Scores</h2>
	<table class="scoresTable">
		<thead>
			<tr>
				<th>Front ID</th>
				<th>Taker Name</th>
				{#each {length: test.num_problems} as _, i}
					<th>Problem {i+1}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each Object.values(testTakersMap) as testTaker}
				<tr>

					<td>{testTaker.front_id}</td>
					<td>{testTaker.taker_name}</td>
					{#each {length: test.num_problems} as _, i}
                        {@const cell = getCellValue(testTaker[i+1])}
						<td style="font-size: 2em; {cell.style}; justify-content: center; align-items: center; height: 100%; min-height: 50px"><b>{cell.value}</b></td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scoresTable {
		width: 100%;
		border-collapse: collapse;
	}
	.scoresTable th, .scoresTable td {
		border: 1px solid #000;
		padding: 8px;
		text-align: center;
	}
	.scoresTable th {
		background-color: var(--primary);
		color: white;
	}
</style>