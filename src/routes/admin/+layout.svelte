<script lang="ts">
    import { isAdmin } from "$lib/supabase";

    let adminUser: boolean;

    async function onPageLoad() {
        adminUser = await isAdmin();
    }

    onPageLoad();
</script>

{#if adminUser}
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