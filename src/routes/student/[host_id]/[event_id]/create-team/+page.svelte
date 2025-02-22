<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import { getStudentTicketOrder } from "$lib/supabase";
  import { user } from "$lib/sessionStore";
  import Loading from "$lib/components/Loading.svelte";
  import { Button, Input } from "flowbite-svelte";

  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);
  let transaction_stored = false;

  let loading = $state(true);
  let token: string | null = null;

  let team_name = $state("");
  let failure: { reason: string; stripe_url?: string } | null = $state(null);

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

      const { data, error } = await supabase
        .from("events")
        .select("eventbrite_event_id")
        .eq("event_id", event_id)
        .single();
      if (error) {
        handleError(error);
        return;
      }

      // If this is an eventbrite event, then the purchase screen is on the event page.
      if (data.eventbrite_event_id) {
        document.location.assign(`${document.location.origin}/student/${host_id}/${event_id}`);
        return;
        
      } 
      const body = {
        event_id,
        host_id,
        token,
        quantity: 1,
        creating_team: true,
        joining_team_code: null,
        is_coach: false,
      };
      const response = await fetch("/api/purchase-stripe-ticket", {
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
  <Loading />
{:else}
  <br />
  <h1>Create Team</h1>
  <br />
  <!-- TODO: form for filling out team name, etc -->
  <form>
    <div class="flex">
      <div style="width: 400px;">
        <Input
          type="text"
          id="team-name"
          bind:value={team_name}
          placeholder="Team Name"
        />
      </div>
    </div>
    <br />
    <div>
      <Button onclick={create_team} pill>Create Team</Button>
    </div>
  </form>
  {#if failure?.reason == "payment not complete"}
    <p>Payment was not started but not completed.</p>
    <a href={failure?.stripe_url}>Click here to complete payment.</a>
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
