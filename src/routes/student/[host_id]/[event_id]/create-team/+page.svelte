<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import { getStudentTicketOrder } from "$lib/supabase";
  import { user } from "$lib/sessionStore";
  import Loading from "$lib/components/Loading.svelte";
  import TeamForm from "$lib/components/TeamForm.svelte";

  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);
  let transaction_stored = false;

  let loading = $state(true);
  let token: string | null = null;

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
        document.location.assign(
          `${document.location.origin}/student/${host_id}/${event_id}`,
        );
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
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  <h1>Create Team</h1>
  <br />
  <TeamForm
    title=""
    {event_id}
    afterSubmit={async (team: any) => {
      document.location.assign("./join-team/" + team.join_code);
    }}
  />
{/if}

<style>
</style>
