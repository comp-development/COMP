<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
    
  const event_id = parseInt($page.params.event_id);
  const join_code = $page.params.joining_team_code;

  let loading = true;
  let token: string | null = null;

  let failure: { reason: string; stripe_url?: string } | null = null;

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
      failure: { reason: string; stripe_url?: string } | null;
    } = await response.json();
    if (response.ok) {
      document.location.assign(`/student/${event_id}/`);
    } else {
      handleError(new Error(json.failure?.reason));
      failure = json.failure!;
    }

    loading = false;
  })();

  function purchase_ticket(options: {
    creating_team?: boolean;
    joining_team_code?: string;
  }) {
    return async () => {
      let body = {
        event_id,
        token,
        quantity: 1,
        creating_team: options.creating_team ?? false,
        joining_team_code: options.joining_team_code ?? null,
        is_coach: false,
      };
      const response = await fetch("/api/purchase-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (response.ok) {
        document.location.assign(text);
      } else {
        handleError(new Error(text));
      }
    };
  }

  // /student/[event_id]/join-team/[join_code] page
  // - POST to /join-team/[join_code]
  // - if error
  //   - display error
  //   - if error is payment is not complete
  //     - print that payment not complete
  //     - link to stripe(success_url = /student/[event_id]/join-team/[join_code])
  //     - link back to /student/[event_id]
  //   - if error is org has insufficient tickets but successful join
  //     - print that joined org but insufficient tickets
  //     - link to /purchase-ticket with joining_team code
  //     - link back to /student/[event_id]
  // - else, redirect to /student/[event_id]
</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <br />
  {#if failure?.reason == "payment not complete"}
    <p>Payment was not started but not completed.</p>
    <a href={failure?.stripe_url}
      >Go to {failure?.stripe_url} to complete payment.</a
    >
  {/if}
  {#if failure?.reason == "joined org, insufficient org tickets"}
    <p>
      Successfully joined organization, but unable to join team due to
      organization lacking tickets.
    </p>
    <button
      on:click={purchase_ticket({
        creating_team: false,
        joining_team_code: join_code,
      })}>Purchase an individual ticket.</button
    >
  {/if}
  {#if failure?.reason == "payment expired"}
    <p>
      Payment session expired because payment was not completed before
      expiration.
    </p>
    <p>Return to the event to open a new payment session.</p>
  {/if}
  {#if failure}
    <p>Failed to join team.</p>
    <a href="..">Return to event.</a>
  {/if}
{/if}

<style>
</style>
