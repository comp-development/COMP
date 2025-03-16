<script lang="ts">
  import { page } from "$app/stores";
  import { supabase } from "$lib/supabaseClient";
  import { handleError } from "$lib/handleError";
  import { getStudentTicketOrder, getEventInformation } from "$lib/supabase";
  import { user } from "$lib/sessionStore";
  import Loading from "$lib/components/Loading.svelte";
  import { Button, Alert, Textarea } from "flowbite-svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";

  const event_id = parseInt($page.params.event_id);
  const host_id = parseInt($page.params.host_id);

  let loading = $state(true);
  let token: string | null = null;
  let ticket_order: any = null;
  let event_details: any = null;
  let refundReason = $state("");
  let requestSubmitted = $state(false);
  let error = $state<string | null>(null);

  (async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error != null) {
      handleError(error);
    }
    token = data.session?.access_token ?? null;
    
    // Get ticket order and event details
    ticket_order = await getStudentTicketOrder($user!.id, event_id);
    event_details = await getEventInformation(event_id);

    // If no ticket order or not an Eventbrite ticket, redirect back to event page
    if (!ticket_order || ticket_order.ticket_service !== "eventbrite") {
      document.location.assign(`/student/${host_id}/${event_id}`);
      return;
    }

    loading = false;
  })();

  async function submitRefundRequest() {
    if (!refundReason.trim()) {
      error = "Please provide a reason for the refund request";
      return;
    }

    try {
      // Store refund request in database
      const { error: dbError } = await supabase
        .from("refund_requests")
        .insert({
          ticket_order_id: ticket_order.order_id,
          student_id: $user!.id,
          event_id: event_id,
          reason: refundReason,
          status: "pending",
          ticket_service: "eventbrite"
        });

      if (dbError) throw dbError;

      // Send email to event organizer
      const response = await fetch("/api/send-refund-request-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id,
          order_id: ticket_order.order_id,
          reason: refundReason,
          token
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send refund request email");
      }

      requestSubmitted = true;
      error = null;
    } catch (e) {
      error = "Failed to submit refund request. Please try again later.";
      console.error(e);
    }
  }
</script>

{#if loading}
  <Loading />
{:else}
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Request Refund</h1>
    
    {#if requestSubmitted}
      <Alert color="green">
        <InfoCircleSolid slot="icon" class="w-5 h-5" />
        Your refund request has been submitted successfully. The event organizers will review your request and process it according to their refund policy. You will receive an email with updates about your refund status.
      </Alert>
      <div class="mt-4">
        <Button href={`/student/${host_id}/${event_id}`} pill>Return to Event</Button>
      </div>
    {:else}
      <Alert color="blue">
        <InfoCircleSolid slot="icon" class="w-5 h-5" />
        <span class="font-medium">Important:</span>
        <ul class="list-disc ml-6 mt-2">
          <li>Refunds are subject to the event's refund policy</li>
          <li>Please provide a clear reason for your refund request</li>
          <li>You will receive email updates about your refund status</li>
        </ul>
      </Alert>

      {#if error}
        <Alert color="red" class="mt-4">
          <InfoCircleSolid slot="icon" class="w-5 h-5" />
          {error}
        </Alert>
      {/if}

      <form class="mt-6" on:submit|preventDefault={submitRefundRequest}>
        <div class="mb-4">
          <label for="refundReason" class="block mb-2">Reason for Refund</label>
          <Textarea
            id="refundReason"
            placeholder="Please explain why you are requesting a refund..."
            required
            rows={4}
            bind:value={refundReason}
          />
        </div>

        <div class="flex gap-4">
          <Button type="submit" pill>Submit Refund Request</Button>
          <Button href={`/student/${host_id}/${event_id}`} color="light" pill>Cancel</Button>
        </div>
      </form>
    {/if}
  </div>
{/if}

<style>
  h1 {
    color: var(--color-primary);
  }
</style> 