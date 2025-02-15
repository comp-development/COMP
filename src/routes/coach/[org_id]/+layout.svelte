<script lang="ts">
  import { page } from "$app/stores";
  import { user } from "$lib/sessionStore";
  import { getOrganization } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";

  const org_id = parseInt($page.params.org_id);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let organization = $state(null);

  (async () => {
    try {
      organization = await getOrganization(org_id);

      if (!organization) {
        error = "This organization doesn't exist.";
      }

      if (!organization.coaches.some((coach) => coach.coach_id === $user?.id)) {
        error = "You are not a part of this organization.";
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
