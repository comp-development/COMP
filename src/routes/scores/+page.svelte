<script lang="ts">
	import { page } from "$app/stores";
	import toast from "svelte-french-toast";
	import { formatTime, addTime, subtractTime } from "$lib/dateUtils";

	import LiveScoreBoard from "$lib/components/LiveScoreBoard.svelte";
	import { handleError } from "$lib/handleError";
	import {
		getThisUser,
		getTestTaker,
		getTest,
		getTeamId,
		getTestAnswers,
	} from "$lib/supabase";

	let loading = true;

	let test_id = Number($page.params.test_id);
	let test;
	(async () => {
		test = await getTest(test_id);
		loading = false;
	})();

</script>

{#if loading}
	<p>Loading...</p>
{:else}
	<LiveScoreBoard {test}/>
{/if}
