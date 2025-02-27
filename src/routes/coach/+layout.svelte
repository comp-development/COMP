<script lang="ts">
  import Loading from "$lib/components/Loading.svelte";
  import posthog from 'posthog-js'
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { user } from "$lib/sessionStore";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { getUser, isType } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import { getThisUser } from "$lib/supabase";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  let can_view_page = $state(false);
  let loading = $state(true);

  

  (async () => {
    try {
      const isCoach = await isType("coach", $user?.id);

      if (isCoach) {
        can_view_page = true;
      } else {
        const isStudent = await isType("student", $user?.id);

        if (isStudent) {
          const newUrl = $page.url.pathname.replace("/coach", "/student");
          goto(newUrl);
        }

        const newUrl = $page.url.pathname.replace("/coach", "/admin");
        goto(newUrl);
      }

      loading = false;
    } catch (error) {
      handleError(error);
    }
  })();
</script>

{#if loading}
  <Loading />
{:else if can_view_page}
  <div class="exterior">
    {@render children?.()}
  </div>
{:else}
  <br />
  <h2 style="text-align: center;">No Access</h2>
{/if}

<style>
  .exterior {
    text-align: center;
    align-items: center;
  }
</style>
