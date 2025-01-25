<script lang="ts">
	import { user } from "$lib/sessionStore";
	import { getCoach } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";

	let coach: any = $state();
	let loading = $state(true);

	(async () => {
		coach = await getCoach($user!.id);
		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
    <br />
    <h1 class="header" style="margin-bottom: 30px;">Welcome to the Coach Portal</h1>
    <h2>{coach.first_name} {coach.last_name}</h2>
{/if}