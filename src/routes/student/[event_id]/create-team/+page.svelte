<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import { getStudentTicketOrder } from "$lib/supabase";
  import { user } from "$lib/sessionStore";

  const event_id = parseInt($page.params.event_id);
  let transaction_stored = false;

  let loading = true;
  let token: string | null = null;

  let team_name = "";
  let failure: { reason: string; stripe_url?: string } | null = null;

  (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;
    const ticket_order = await getStudentTicketOrder($user!.id, event_id);
    transaction_stored = ticket_order != null;

    // If there is no stored transaction, redirect the student to payment page.
    if (!transaction_stored) {
      let body = {
        event_id,
        token,
        quantity: 1,
        creating_team: true,
        joining_team_code: null,
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
    }

    loading = false;
  })();

  async function create_team() {
    let body = {
      event_id,
      token,
      team_name,
    };
    const response = await fetch("./create-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: {
      success: { team_join_code: string } | null;
      failure: { reason: string; stripe_url?: string } | null;
    } = await response.json();
    if (response.ok) {
      document.location.assign("./join-team/" + json.success!.team_join_code);
    } else {
      handleError(new Error(json.failure?.reason));
      failure = json.failure!;
    }
  }

</script>

{#if loading}
  <p>Loading...</p>
{:else}
  <br />
  <!-- TODO: form for filling out team name, etc -->
  <form>
    <div>
      <label for="team-name">Team Name: </label>
      <input type="text" id="team-name" bind:value={team_name} />
    </div>
    <br />
    <div>
      <button on:click={create_team}>Create Team</button>
    </div>
  </form>
  {#if failure?.reason == "payment not complete"}
    <p>Payment was not started but not completed.</p>
    <a href={failure?.stripe_url}
      >Click here to complete payment.</a
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
    <p>Failed to create team.</p>
    <a href=".">Return to event.</a>
  {/if}
{/if}

<style>
</style>
