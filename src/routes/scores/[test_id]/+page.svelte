<script lang="ts">
	import { page } from "$app/stores";
	import LiveScoreBoard from "$lib/components/LiveScoreBoard.svelte";
	import { getTest } from "$lib/supabase";

	console.log("SUP");
	let loading = true;

	let test_id = Number($page.params.test_id);
	let test;
	(async () => {
		test = await getTest(test_id);
		loading = false;
	})();
</script>

<div style="padding: 10px">
	{#if loading}
		<p>Loading...</p>
	{:else if test.test_mode != "Guts"}
		Live score not available for this test.
	{:else}
		<LiveScoreBoard {test} />
	{/if}
</div>
