<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { getHostInformation } from "$lib/supabase";

    let loading = $state(true);
    let host: any = $state();
    const host_id = parseInt($page.params.host_id);

    (async () => {
        host = await getHostInformation(host_id);
        loading = false;
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <br />
    <h2>Welcome to...</h2>
    <h1>{host?.host_name}</h1>
    <br />
    <p>More information about this organization coming soon.</p>
{/if}