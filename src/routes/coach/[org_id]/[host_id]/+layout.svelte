<script lang="ts">
    import { page } from "$app/stores";
    import { getHostInformation } from "$lib/supabase";
    import Loading from "$lib/components/Loading.svelte";

    const host_id = parseInt($page.params.host_id);
    let loading = $state(true);
    let error = $state<string | null>(null);

    (async () => {
        try {
            const host = await getHostInformation(host_id);
            
            if (!host) {
                error = "This host organization doesn't exist.";
            }
        } catch (e) {
            error = "Error checking host access. Please try again later.";
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
