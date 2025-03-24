<!-- {/* Create new TicketCard component */} -->
<script lang="ts">
  import { Card, Badge, Button, Modal, Input } from "flowbite-svelte";
  import type { Tables } from "../../../db/database.types";
  import { createEventDispatcher } from "svelte";

  export let ticket: Tables<"ticket_orders">;
  export let onRequestRefund: (first_name: string, last_name: string, email: string, ticket: Tables<"ticket_orders">) => void;

  let showModal = false;
  export let first_name: string | null = "";
  export let last_name: string | null = "";
  export let email: string | null = "";

  console.log("ticket", ticket);
  console.log("first_name", first_name);


  function handleRefundRequest() {
    onRequestRefund(first_name, last_name, email, ticket);
    showModal = false;
  }

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
      <span class="text-gray-700 dark:text-gray-300">Status:</span>
      <Badge
        color={ticket.refund_status === "NONE" ? "dark" :
               ticket.refund_status === "REQUESTED" ? "yellow" :
               ticket.refund_status === "APPROVED" ? "green" :
               ticket.refund_status === "DENIED" ? "red" : "dark"}
      >
        {ticket.refund_status}
      </Badge>
    </div>
    <div class="flex items-center justify-between">
      <!-- <span class="text-gray-700 dark:text-gray-300">Type:</span> -->
      <!-- <span class="font-medium">{ticket.ticket_service}</span> -->
    </div>
    <div class="flex items-center justify-between">
        <span class="text-gray-700 dark:text-gray-300">Quantity:</span>
        <span class="font-medium">{ticket.quantity}</span>
      </div>
    {#if ticket.refund_status == "NONE"}
      <div class="mt-4">
        <Button color="red" class="w-full" on:click={() => (showModal = true)}>
          Request Refund
        </Button>
      </div>
    {/if}
  </div>
</Card> 

<Modal bind:open={showModal}>
  <div class="p-6">
    <h2 class="text-xl font-semibold">Request Refund</h2>
    <p class="text-sm text-gray-600">Please provide your details to proceed. The details must match the details you purchased your ticket with! If you are a coach requesting tickets on behalf an organization, please enter the information of the coach who purchased the tickets.</p>

    <div class="mt-4">
      <div class="text-sm text-gray-600">*Required</div>
      <div class="mt-2 text-left"> First Name: </div>
      <Input bind:value={first_name} placeholder="Enter your first_name" />
    </div>

    <div class="mt-4">
      <div class="text-sm text-gray-600">*Required</div>
      <div class="mt-2 text-left"> Last Name: </div>
      <Input bind:value={last_name} placeholder="Enter your last name" />
    </div>

    <div class="mt-4">
      <div class="text-sm text-gray-600">*Required</div>
      <div class="mt-2 text-left"> Email: </div>
      <Input bind:value={email} type="email" placeholder="Enter your email" />
    </div>

    <div class="mt-6 flex justify-end gap-2">
      <Button on:click={() => (showModal = false)}>Cancel</Button>
      <Button on:click={handleRefundRequest} color="blue">Submit</Button>
    </div>
  </div>
</Modal>