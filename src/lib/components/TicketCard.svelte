<!-- {/* Create new TicketCard component */} -->
<script lang="ts">
  import { Card, Badge, Button } from "flowbite-svelte";
  import type { Tables } from "../../../db/database.types";

  export let ticket: Tables<"ticket_orders">;
  export let onRequestRefund: () => void;
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
        <Button color="red" class="w-full" on:click={onRequestRefund}>
          Request Refund
        </Button>
      </div>
    {/if}
  </div>
</Card> 