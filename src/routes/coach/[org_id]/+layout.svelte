<script lang="ts">
    import { page } from "$app/stores";
    import { user } from "$lib/sessionStore";
    import { getOrganization } from "$lib/supabase";
    import Loading from "$lib/components/Loading.svelte";

    const org_id = parseInt($page.params.org_id);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let organization = $state(null);

    (async () => {
        try {
            organization = await getOrganization(org_id);
            
            if (!organization) {
                error = "This organization doesn't exist.";
                return;
            }

            if (!organization.coaches.some((coach) => coach.coach_id === $user?.id)) {
                error = "You are not a part of this organization.";
                return;
            }
        } catch (e) {
            error = "Error checking organization access. Please try again later.";
            console.error(e);
        } finally {
            console.log(error);
            loading = false;
        }
    })();
</script>

{#if loading}
    <Loading />
{:else if error}
    <p>You don't have access to this page</p>
{:else}
    <slot />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
