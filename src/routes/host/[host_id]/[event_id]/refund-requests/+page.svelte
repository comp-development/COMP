<script lang="ts">
  import { page } from "$app/stores";
  import { Button, Card, Alert, Badge } from "flowbite-svelte";
  import Loading from "$lib/components/Loading.svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
  import { user } from "$lib/sessionStore";
  import {
    getEventInformation,
    getEventTickets,
    getHostInformation,
  } from "$lib/supabase";
  import type { Tables } from "../../../../../../db/database.types";
  import { handleError } from "$lib/handleError";
  import EventDisplay from "$lib/components/EventDisplay.svelte";
  import { supabase } from "$lib/supabaseClient";
  import { onMount } from "svelte";

  type TicketWithDetails = Tables<"ticket_orders"> & {
    student: {
      first_name: string;
      last_name: string;
    } | null;
    org: {
      name: string;
    } | null;
  };

  const host_id = parseInt($page.params.host_id);
  const event_id = parseInt($page.params.event_id);
  let loading = $state(false);
  let host = $state(null);
  let event_details: Tables<"events"> | null = $state(null);
  let tickets: TicketWithDetails[] = $state([]);

  async function handleRefundAction(ticket: TicketWithDetails, action: 'APPROVED' | 'DENIED') {
    try {
      const { error } = await supabase
        .from("ticket_orders")
        .update({ refund_status: action })
        .eq("id", ticket.id);
      if (error) throw error;
      // Refresh tickets after action
      tickets = await getEventTickets(event_id);
    } catch (e) {
      if (e instanceof Error) {
        handleError(e);
      } else {
        handleError(new Error(String(e)));
      }
    }
  }

  onMount(async () => {
    console.log("LOADING", loading);
    host = await getHostInformation(host_id);
    event_details = await getEventInformation(event_id);
    tickets = await getEventTickets(event_id);
    loading = false;
    console.log("LOADING", loading);
  });


  

</script>

{#if loading}
  <Loading />
{:else}
  <EventDisplay id={event_id} {host} event={event_details} editable={false} />
  <hr /><br />

  <div class="p-6">
    <div class="grid grid-cols-3 gap-8">
      <!-- Pending Refunds -->
      <div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 class="text-2xl font-bold mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center gap-2">
            Pending Requests
            <Badge color="yellow" class="text-sm">
              {tickets.filter(t => t.refund_status === 'REQUESTED').length}
            </Badge>
          </h4>
          <div class="overflow-y-auto max-h-[70vh] space-y-4">
            {#each tickets.filter(t => t.refund_status === 'REQUESTED') as ticket}
              <Card>
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <div>
                      <h5 class="text-lg font-semibold">
                        {ticket.student ? `${ticket.student.first_name} ${ticket.student.last_name}` : ticket.org?.name || 'Unknown'}
                      </h5>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Order ID: {ticket.order_id}
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Requested: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge color="yellow">Pending</Badge>
                  </div>
                  <div class="flex gap-2 pt-2">
                    <Button size="xs" color="green" on:click={() => handleRefundAction(ticket, 'APPROVED')}>
                      Approve
                    </Button>
                    <Button size="xs" color="red" on:click={() => handleRefundAction(ticket, 'DENIED')}>
                      Deny
                    </Button>
                  </div>
                </div>
              </Card>
            {/each}
          </div>
        </div>
      </div>

      <!-- Approved Refunds -->
      <div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 class="text-2xl font-bold mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center gap-2">
            Approved Refunds
            <Badge color="green" class="text-sm">
              {tickets.filter(t => t.refund_status === 'APPROVED').length}
            </Badge>
          </h4>
          <div class="overflow-y-auto max-h-[70vh] space-y-4">
            {#each tickets.filter(t => t.refund_status === 'APPROVED') as ticket}
              <Card>
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <div>
                      <h5 class="text-lg font-semibold">
                        {ticket.student ? `${ticket.student.first_name} ${ticket.student.last_name}` : ticket.org?.name || 'Unknown'}
                      </h5>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Order ID: {ticket.order_id}
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Approved: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge color="green">Approved</Badge>
                  </div>
                </div>
              </Card>
            {/each}
          </div>
        </div>
      </div>

      <!-- Denied Refunds -->
      <div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h4 class="text-2xl font-bold mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center gap-2">
            Denied Refunds
            <Badge color="red" class="text-sm">
              {tickets.filter(t => t.refund_status === 'DENIED').length}
            </Badge>
          </h4>
          <div class="overflow-y-auto max-h-[70vh] space-y-4">
            {#each tickets.filter(t => t.refund_status === 'DENIED') as ticket}
              <Card>
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <div>
                      <h5 class="text-lg font-semibold">
                        {ticket.student ? `${ticket.student.first_name} ${ticket.student.last_name}` : ticket.org?.name || 'Unknown'}
                      </h5>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Order ID: {ticket.order_id}
                      </p>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        Denied: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge color="red">Denied</Badge>
                  </div>
                </div>
              </Card>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.card) {
    transition: transform 0.2s;
  }
  :global(.card:hover) {
    transform: translateY(-2px);
  }
</style> 