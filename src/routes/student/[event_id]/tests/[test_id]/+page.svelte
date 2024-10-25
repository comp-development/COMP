<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import { ExpandableTile } from "carbon-components-svelte";
	import { formatTime, addTime, subtractTime } from "$lib/dateUtils";

	import TestView from "$lib/components/TestView.svelte";
	import MathJax from "$lib/components/MathJax.svelte";
	import Button from "$lib/components/Button.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getTestTaker,
		getTest,
		getTeamId,
	} from "$lib/supabase";
  import { TextSubscript } from "carbon-icons-svelte";

	let loading = true;
	let disallowed = false;

	let test_id = Number($page.params.test_id);
	let is_team = $page.params.test_id.charAt(0) == "t" ? true : false;

	let user;
	let test;
	let test_taker;
	(async () => {
		user = await getThisUser();
		test = await getTest(test_id);
		//console.log("USER_ID", user.id);
		await getThisTestTaker();
		//console.log("GOT TAKER")
		loading = false;
	})();

	async function getThisTestTaker() {
		//console.log("GET TAKER")
		const is_team = (await getTest(test_id)).is_team;
		let taker_id = user.id;
		if (is_team) {
			taker_id = await getTeamId(taker_id);
		}
		//console.log("NUMBER", test_id);
		test_taker = await getTestTaker(test_id, taker_id, is_team);
		//console.log("TEST_TAKER", test_taker);

		if (!test_taker) {
			disallowed = true;
			loading = false;
			throw new Error(
				"Test with id " + $page.params.test_id + " doesn't exist!",
			);
		}
		//console.log("TEST_TAKER", test_taker);
	}

	
</script>

{#if loading}
	<p>Loading...</p>
{:else if disallowed}
	<p>You are not authorized!</p>
{:else}
	<br />
	<h1>{test.test_name}</h1>
	{#if test.division}
		<h2>{test.division}</h2>
	{/if}
	<div style="padding: 20px;">
		<ExpandableTile light expanded tileExpandedLabel="View less" tileCollapsedLabel="View more">
			<div slot="above"><p style="font-weight: bold">Test Instructions</p></div>
			<div slot="below"><MathJax math={test.instructions} /></div>
		</ExpandableTile>
		<br />
		<TestView {test_taker} is_team={test.is_team} settings={test.settings} />
	</div>
	<br />
{/if}

<style>
	h1 {
		text-align: center;
	}
</style>
