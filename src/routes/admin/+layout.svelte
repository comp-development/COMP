<script lang="ts">
    import { isAdmin } from "$lib/supabase";
    import Loading from "$lib/components/Loading.svelte";

    let adminUser: boolean;
    let loading = true;

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
        <slot />
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