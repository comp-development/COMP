<script lang="ts">
    import { page } from "$app/stores";
    import { redirect } from "@sveltejs/kit";
    import { isEventPublished } from "$lib/supabase";
    import Loading from "$lib/components/Loading.svelte";

    const event_id = parseInt($page.params.event_id);
    let loading = $state(true);
    let error = $state<string | null>(null);

    (async () => {
        try {
            const published = await isEventPublished(event_id);
            
            if (!published) {
                error = "This event has not been published yet.";
            }
        } catch (e) {
            error = "Error checking event status. Please try again later.";
            console.error(e);
        } finally {
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
