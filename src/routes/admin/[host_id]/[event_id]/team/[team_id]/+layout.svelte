<script lang="ts">
    import { page } from "$app/stores";
    import { getSingularEventTeam } from "$lib/supabase";
    import Loading from "$lib/components/Loading.svelte";
    import { handleError } from "$lib/handleError";

    const event_id = parseInt($page.params.event_id);
    const team_id = parseInt($page.params.team_id);

    let loading = $state(true);
    let error = $state<string | null>(null);

    (async () => {
        try {
            const team = await getSingularEventTeam(team_id, event_id);

            if (team.length == 0) {
                error = "This team does not exist under this event.";
            }

            loading = false;
        } catch (e) {
            handleError(e);
        }
    })();
</script>

{#if loading}
    <Loading />
{:else if error}
    <h2 style="text-align: center;">No Access</h2>
{:else}
    <slot />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
