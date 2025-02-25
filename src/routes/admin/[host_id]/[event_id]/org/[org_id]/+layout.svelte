<script lang="ts">
  import { page } from "$app/stores";
  import { ifOrgEvent } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";

  const event_id = parseInt($page.params.event_id);
  const org_id = parseInt($page.params.org_id);

  let loading = $state(true);
  let error = $state<string | null>(null);

  (async () => {
    try {
      const organization = await ifOrgEvent(org_id, event_id);

      if (!organization) {
        error = "This event does not exist under this host organization.";
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
