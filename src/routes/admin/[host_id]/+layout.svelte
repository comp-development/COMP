<script lang="ts">
  import { page } from "$app/stores";
  import { getAdminHosts } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";
  import { user } from "$lib/sessionStore";

  const host_id = parseInt($page.params.host_id);
  let loading = $state(true);
  let error = $state<string | null>(null);

  (async () => {
    try {
      const hosts = await getAdminHosts($user!.id);
      const host = hosts.filter((h) => h.host_id === host_id);

      if (host.length == 0) {
        error = "This host organization doesn't exist.";
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
