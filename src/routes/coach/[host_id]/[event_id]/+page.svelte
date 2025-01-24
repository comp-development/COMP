<script lang="ts">
    import Loading from "$lib/components/Loading.svelte";

    let loading = $state(true);

    (async () => {
        //get data

        loading = false;
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <h1>Test</h1>
{/if}