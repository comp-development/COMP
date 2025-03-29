<!-- {/* Create new TicketCard component */} -->
<script lang="ts">
  import { Card, Badge, Button, Modal, Input } from "flowbite-svelte";
  import type { Tables } from "../../../db/database.types";
  import { createEventDispatcher } from "svelte";


  // we want to be able to have a ticket, as well as all the existing refund orders on it

  // export let ticket: Tables<"ticket_orders">;
  export let ticket:
    | (Tables<"ticket_orders"> & { refund_requests: Tables<"refund_requests">[] })
    | null;

  export let onRequestRefund: (refunded_tickets: numbers, message: string, ticket: Tables<"ticket_orders">) => void;

  let showModal = false;

  let refunded_tickets = 0;

  let message = "";


  export let available_tickets = 0;

  function handleRefundRequest() {
    onRequestRefund(refunded_tickets, message, ticket);
    showModal = false;
  }

  console.log("ticket", ticket);
  console.log(available_tickets);


</script>

<Card>
  <h5 class="mb-4 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
    Ticket Information
  </h5>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-gray-700 dark:text-gray-300">Ticket ID:</span>
      <span class="font-medium">{ticket.order_id}</span>
    </div>
    <div class="flex items-center justify-between">
    </div>
    <div class="flex items-center justify-between">
        <span class="text-gray-700 dark:text-gray-300">Quantity:</span>
        <span class="font-medium">{ticket.quantity}</span>
      </div>
    {#if (ticket?.refund_requests?.length || 0) == 0}
      <div class="flex items-center justify-between">
        <Button color="red" class="w-full" on:click={() => (showModal = true)}>
          Request Refund
        </Button>
      </div>
    {:else if (ticket?.refund_requests?.length || 0) > 0}
      <div class="mt-4">
        <Button color="red" class="w-full" on:click={() => (showModal = true)}>
          View Refund Status
        </Button>
      </div>
    {/if}
  </div>
</Card> 

<Modal bind:open={showModal}>
  <div class="overflow-y-scroll max-h-[70vh] max-w-[80vh]">
  <div class="p-6">
    <h2 class="text-xl font-semibold">Request Refund</h2>
    <p class="text-sm text-gray-600">Please enter how many tickets you would like to request a refund for. Please don't request more tickets than you have.</p>

    <div class="mt-4">
      <div class="text-sm text-gray-600">*Required</div>
      <div class="mt-2 text-left"> Refunded Tickets: </div>
      <Input 
        bind:value={refunded_tickets} 
        type="number" 
        min="1" 
        max={available_tickets} 
        placeholder="Number of tickets to refund" 
      /> 
    </div>


    <div class="mt-4">
      <div class="mt-2 text-left"> Reasonn for refund? </div>
      <Input 
        bind:value={message} 
        type="text" 
        placeholder="Request for refund" 
      /> 
    </div>

    <div class="mt-6 flex justify-end gap-2">
      <Button on:click={() => (showModal = false)}>Cancel</Button>
      <Button on:click={handleRefundRequest} color="blue">Submit</Button>
    </div>
  </div>
  

  {#if ticket?.refund_requests && ticket?.refund_requests.length > 0}
  <div class="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
    <h3 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
      Existing Refund Requests
    </h3>
    <ul class="space-y-2">
      {#each ticket?.refund_requests as request}
        <li class="flex items-center rounded-md bg-gray-50 p-3 dark:bg-gray-800">
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Request ID: <span class="font-semibold">{request.id}</span>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Status: <span class="font-semibold">{request.refund_status}</span>,
              Quantity: <span class="font-semibold">{request.quantity}</span>
            </p>
            {#if request.request_reason}
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Reason for request: <span class="font-semibold">{request.request_reason}</span>
                </p>
            {/if}
            {#if request.response_reason}
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Host Response: <span class="font-semibold">{request.response_reason}</span>
            </p>
        {/if}
          </div>
          {#if request.refund_status === 'APPROVED'}
            <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-200 dark:text-green-900">
              Approved
            </span>
          {:else if request.refund_status === 'PENDING'}
            <span class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900">
              Pending
            </span>
          {:else if request.refund_status === 'DENIED'}
            <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-200 dark:text-red-900">
              Denied
            </span>
          {:else}
            <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:bg-gray-200 dark:text-gray-900">
              {request.refund_status}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if}
</div>

</Modal>