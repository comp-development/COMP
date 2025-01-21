<script lang="ts">
    import { isAdmin } from "$lib/supabase";
    import Loading from "$lib/components/Loading.svelte";
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

    let adminUser: boolean = $state();
    let loading = $state(true);

    async function onPageLoad() {
        adminUser = await isAdmin();
        loading = false;
    }

    onPageLoad();
</script>

{#if loading}
    <Loading />
{:else if adminUser}
    <div class="exterior">
        {@render children?.()}
    </div>
{:else}
    <h2 style="text-align: center;">You do not have permission to access this page.</h2>
{/if}

<style>
    .exterior {
        text-align: center;
        align-items: center;
    }
</style>