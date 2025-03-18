<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { getEventInformation } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import { Button } from "flowbite-svelte";
  import Loading from "$lib/components/Loading.svelte";

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);
  const join_code = $page.params.code;

  let loading = $state(true);
  let event_details = $state(null);
  let token: string | null = null;

  let failure: { reason: string; stripe_url?: string } | null = $state(null);

  (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;

    event_details = await getEventInformation(event_id);

    if (event_details?.eventbrite_event_id) {
      // Load the Eventbrite widget
      const script = document.createElement('script');
      script.src = 'https://www.eventbrite.com/static/widgets/eb_widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }

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
      document.location.assign(`/student/${host_id}/${event_id}/`);
    } else {
      handleError(new Error(json.failure?.reason));
      failure = json.failure!;
      
      if (failure.reason == "missing payment session") {
        await purchase_ticket();
      } else if (failure.reason.includes("not registered for this tournament")) {
        loading = true;
        document.location.assign(`/student/${host_id}/${event_id}?team_join_code=${join_code}`);
      }
    }

    loading = false;
  })();

  async function purchase_ticket() {
    let body = {
      event_id,
      host_id,
      token,
      quantity: 1,
      creating_team: false,
      joining_team_code: join_code,
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

  async function eventbritePurchase(data) {
    console.log("Order completed with ID:", data);
    try {
        const { data: authData, error } = await supabase.auth.getSession();
        if (error != null) {
          handleError(error);
        }
        const token = authData.session?.access_token ?? null;
        const response = await fetch('/api/purchase-eventbrite-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_id,
                host_id,
                token,
                creating_team: false,
                joining_team_code: join_code,
                is_coach: false,
                eventbrite_order_id: data.orderId,
            }),
        });
        const text = await response.text();
        if (response.ok) {
          document.location.assign(text);
        } else {
          handleError(new Error(text));
        }
        // Handle success (e.g., redirect or show a success message)
    } catch (error) {
        handleError(error);
    }
  }

  function openEventbriteWidget() {
    const eventbriteEventId = event_details?.eventbrite_event_id; // Replace with your actual Eventbrite event ID
    if (eventbriteEventId) { // Check if the event ID is valid
        window.EBWidgets.createWidget({
            widgetType: 'checkout',
            eventId: eventbriteEventId,
            modal: true,
            modalTriggerElementId: 'eventbrite-widget-container',
            onOrderComplete: eventbritePurchase,
            promoCode: "student",
        });
    }
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
  //     - link to /purchase-stripe-ticket with joining_team code
  //     - link back to /student/[event_id]
  // - else, redirect to /student/[event_id]
</script>

{#if loading}
  <Loading />
{:else}
  <br />
  {#if failure?.reason == "payment not complete"}
    <p>Payment was started but not completed.</p>
    <Button onclick={event_details.eventbrite_event_id ? openEventbriteWidget : document.location.assign(failure?.stripe_url)} id={event_details.eventbrite_event_id ? 'eventbrite-widget-container' : 'purchase-modal-container'} pill>Click here to complete payment.</Button>
    <br />
  {/if}
  {#if failure?.reason == "joined org, insufficient org tickets"}
    <p>
      Successfully joined organization, but unable to join team due to
      organization lacking tickets.
    </p>
    <!-- trying to avoid people paying when they shouldn't
    <button
      onclick={purchase_ticket({
        creating_team: false,
        joining_team_code: join_code,
      })}>Purchase an individual ticket.</button
    >
    -->
  {/if}
  {#if failure?.reason == "payment expired"}
    <p>
      Payment session expired because payment was not completed before
      expiration.
    </p>
    <br />
    <p>Return to the event to open a new payment session.</p>
  {/if}
  {#if failure}
    <h2>Failed to Join Team</h2>
    <p>{failure?.reason}</p>
    <br />
    <Button href=".." pill>Return to event</Button>
  {/if}
{/if}

<style>
</style>
