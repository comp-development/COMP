<script lang="ts">
  import { page } from "$app/stores";
  import { getAdminHosts } from "$lib/supabase";
  import Loading from "$lib/components/Loading.svelte";
  import { handleError } from "$lib/handleError";
  import { user } from "$lib/sessionStore";
  import { goto } from "$app/navigation";

  const host_id = parseInt($page.params.host_id);
  let loading = $state(true);
  let error = $state<string | null>(null);

  (async () => {
    try {
      const hosts = await getAdminHosts($user!.id);
      const host = hosts.filter((h) => h.host_id === host_id);

      if (host.length == 0) {
        error = "This host organization doesn't exist.";
      } else {
        // Check if user is a host_admin with grader=true but owner=false
        const hostAdmin = host[0].host_admins.find(ha => ha.admin_id === $user!.id);
        
        if (hostAdmin && hostAdmin.grader && !hostAdmin.owner) {
          // Check if not already on a grading route
          const currentPath = $page.url.pathname;
          if (!currentPath.includes('12/grading')) {
            goto(`/admin/${host_id}/12/grading`);
          }
        }

        // Apply styles
        Object.entries(host[0].styles || {}).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value);
        });
      }

      loading = false;
    } catch (e) {
      handleError(e as Error);
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

  :global(.cls-1),
  :global(.cls-2) {
    fill: var(--primary) !important;
  }
</style>
