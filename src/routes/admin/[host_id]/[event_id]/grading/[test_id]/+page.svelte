<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import Grading from "$lib/components/Grading.svelte";
	import Loading from "$lib/components/Loading.svelte";
	import { user } from "$lib/sessionStore";
	import { getAdminHosts } from "$lib/supabase";
	import type { Tables } from "../../../../../../../db/database.types";
	import Button from "$lib/components/Button.svelte";

	const host_id = parseInt($page.params.host_id);
	let hostAdmin: Tables<"host_admins"> | null = null;
	const paramsString = window.location.search;
	const searchParams = new URLSearchParams(paramsString);
	let loading = true;
	let is_override = false;
	function goToViewScans() {
		const currentUrl = $page.url.pathname;
		goto(`${currentUrl}/view-scans`);
	}
	(async () => {
		const hosts = await getAdminHosts($user!.id);
		const host = hosts.filter((h) => h.host_id === host_id);
		hostAdmin =
			host[0].host_admins.find((ha) => ha.admin_id === $user!.id) ?? null;
		is_override = searchParams.get("override") != null;
		console.log("override", is_override && hostAdmin?.owner);
		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
	{#if hostAdmin?.owner}
		{#if is_override}
			<p>To go back to normal grading, remove "?override".</p>
		{:else}
			<p>To go to conflict resolution, append "?override" to the URL.</p>
		{/if}
	{:else}
		<p>If you need conflict resolution perms, contact COMP admins.</p>
	{/if}

	<Button title="View All Scans" href="/admin/{host_id}/{$page.params.event_id}/grading/{$page.params.test_id}/view-scans" />


	<Grading
		event_id={parseInt($page.params.event_id)}
		testId={parseInt($page.params.test_id)}
		onlyConflicted={is_override && hostAdmin?.owner}
		showGrades={is_override && hostAdmin?.owner}
		disableUnsure={is_override && hostAdmin?.owner}
	/>
{/if}
