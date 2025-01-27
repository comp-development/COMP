<script lang="ts">
    import { page } from "$app/stores";
    import Loading from "$lib/components/Loading.svelte";
    import { getHostInformation } from "$lib/supabase";
    import MarkdownRender from "$lib/components/MarkdownRender.svelte";

    let loading = true;
    let host: any = {};
    const host_id = parseInt($page.params.host_id);

    (async () => {
        host = await getHostInformation(host_id);
        loading = false;
    })();
</script>

{#if loading}
    <Loading />
{:else}
    <div class="container mx-auto p-6 space-y-6">
        <h2 class="text-2xl font-bold text-gray-800 text-center">Welcome to...</h2>
        <h1 class="text-4xl font-extrabold text-center">{host?.host_name}</h1>

        {#if host?.logo}
            <div class="flex justify-center">
                <img src="{host.logo}" alt="{host.host_name} logo" class="w-32 h-32 rounded-full shadow-lg" />
            </div>
        {/if}

        {#if host?.email}
            <div class="text-center">
                <p class="text-lg text-gray-600">Contact us at:</p>
                <a href="mailto:{host.email}" class="text-lg text-blue-500 hover:underline">{host.email}</a>
            </div>
        {/if}

        {#if host?.summary}
            <h2>Summary</h2>
            <MarkdownRender source={host.summary} />
        {/if}
    </div>
{/if}

<style>
    .container {
        max-width: 768px;
    }
</style>
