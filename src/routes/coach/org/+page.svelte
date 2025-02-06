<script lang="ts">
	import { user } from "$lib/sessionStore";
	import { addOrganization } from "$lib/supabase";
	import Loading from "$lib/components/Loading.svelte";
    import { handleError } from "$lib/handleError";
    import CreateOrgForm from "$lib/components/CreateOrgForm.svelte";

	let loading = $state(true);

    async function handleSubmit() {
        try {
            const organization = await addOrganization(newResponses, $user.id);
            window.location.href = `/coach/org/${organization.org.org_id}`;
        } catch (e) {
            handleError(e);
        }
    }

	(async () => {
		loading = false;
	})();
</script>

{#if loading}
	<Loading />
{:else}
    <br />
    <h1 class="header">Create Organization</h1>
    <CreateOrgForm handleSubmit={handleSubmit} />
{/if}