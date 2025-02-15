<script lang="ts">
  import { page } from "$app/stores";
  import { isEventPublished } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";

  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);

  let loading = $state(true);
  let error = $state<string | null>(null);

  (async () => {
    try {
      const published = await isEventPublished(event_id, host_id);

      if (!published) {
        error = "This event has not been published yet.";
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
