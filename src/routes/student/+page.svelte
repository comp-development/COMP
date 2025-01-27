<script lang="ts">
	import { user } from "$lib/sessionStore";
	import { getStudent } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";

	let student: any = $state();
	let loading = $state(true);

	(async () => {
		student = await getStudent($user!.id);
		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
	<br />
	<h1>Welcome, {student.first_name} {student.last_name}</h1>
	<h2 style="font-weight: 500">{$user?.email}</h2>
{/if}