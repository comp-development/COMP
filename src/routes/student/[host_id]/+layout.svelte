<script lang="ts">
  import { page } from "$app/stores";
  import { getHostInformation } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";
  const host_id = parseInt($page.params.host_id);
  let loading = $state(true);
  let error = $state<string | null>(null);

  (async () => {
    try {
      const host = await getHostInformation(host_id);

      if (!host) {
        error = "This host organization doesn't exist.";
      }

      Object.entries(host.styles || {}).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });

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
