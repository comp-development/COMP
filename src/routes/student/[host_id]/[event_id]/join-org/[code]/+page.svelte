<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import { Button } from "flowbite-svelte";
  import Loading from "$lib/components/Loading.svelte";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);
  const join_code = $page.params.code;

  let loading = $state(true);
  let token: string | null = null;

  let failure: { reason: string } | null = $state(null);

  (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;
    
    let body = {
      event_id,
      token,
      join_code,
    };
    
    const response = await fetch(`./${join_code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: {
      failure: { reason: string } | null;
    } = await response.json();
    if (response.ok) {
      document.location.assign(`/student/${host_id}/${event_id}/`);
    } else {
      handleError(new Error(json.failure?.reason));
      failure = json.failure!;

      if (failure.reason.includes("not registered for this tournament")) {
        document.location.assign(`/student/${host_id}/${event_id}?org_join_code=${join_code}`);
      }
    }

    loading = false;
  })();
</script>

{#if loading}
  <Loading />
{:else}
  {#if failure}
    <h2>Failed to Join Organization</h2>
    <p>{failure?.reason}</p>
    <br />
    <Button href=".." pill>Return to event</Button>
  {/if}
{/if}