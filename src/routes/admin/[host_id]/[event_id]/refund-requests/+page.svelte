<script lang="ts">
  import { page } from "$app/stores";
  import { getEventRefundRequests, getEventRefundedRequests } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import { Button, Badge, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from "flowbite-svelte";
  import type { Tables } from "$lib/../../db/database.types";
  import CustomTable, { type UnifiedColumn } from "$lib/components/CustomTable.svelte";
  import type { AsyncReturnType, Unpacked } from "$lib/supabaseClient";
  const event_id = parseInt($page.params.event_id);
  let loading = true;
  let refundRequests: AsyncReturnType<typeof getEventRefundRequests> = [];
  let refundedRequests: AsyncReturnType<typeof getEventRefundedRequests> = [];

  (async () => {
    console.log("LOADING", loading);
    try {
      console.log("Fetching refund requests for event:", event_id);
      refundRequests = await getEventRefundRequests(event_id);

      refundedRequests = await getEventRefundedRequests(event_id);

      console.log("Received refund requests:", refundRequests);
      console.log("Received refunded requests:", refundedRequests);

    } catch (error) {
      console.error("Error fetching refund requests:", error);
      if (error instanceof Error) {
        handleError(error);
      }
    } finally {
      loading = false;
    }
  })();

  async function handleRefundAction(ticketId: number, action: "APPROVED" | "DENIED") {
    try {
      loading = true;
      const response = await fetch("/api/update-refund-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: action,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update refund status: " + (await response.text()));
      }

      // Refresh the refund requests list
      refundRequests = await getEventRefundRequests(event_id);
    } catch (error) {
      if (error instanceof Error) {
        handleError(error);
      }
    } finally {
      getEventRefundRequests(event_id);
      loading = false;
    }
  }

  function reshapeRefundRequest<T extends AsyncReturnType<typeof getEventRefundRequests>>(requests: T) {
    return requests.map(r => (
       {
        ...r,
        created_at: new Date(r.created_at).toLocaleDateString(),
        requestor_id: r.student_id ? r.students?.first_name + " " + r.students?.first_name : r.orgs?.name,
        actions: r.refund_status,
      }
    ));
  }

  const ticket_order_columns = [
    {key: "order_id", label: "Order ID", visible: true, dataType: 'string'},
    {key: "ticket_service", label: "Ticket Service", visible: true, dataType: 'string'},
    {key: "requestor_id", label: "Requested By", visible: true, dataType: 'string'},
    {key: "quantity", label: "Quantity", visible: true, dataType: 'string'},
    {key: "refund_status", label: "Status", visible: true, dataType: 'string', format: (_, r) => {
      const COLORS: {[key in Unpacked<typeof refundRequests>["refund_status"]]: string} = {
        'REQUESTED': 'yellow',
        'APPROVED': 'green',
        'DENIED': 'red',
        'NONE': 'dark',
      };
      return {text: r.refund_status, isBadge: true, color: COLORS[(r as Unpacked<typeof refundRequests>).refund_status]}
    }},
    {key: "actions", label: "Actions", visible: true, dataType: 'string', format: "column-snippet"
    },
  ] as UnifiedColumn[];
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">Refund Requests</h1>

  {#if loading}
    <p>Loading refund requests...</p>
  {:else}
    <div class="mb-4">
      <p> Before accepting a refund request via eventbrite, please make sure to go to the eventbrite portal
        and manually approve the refund for this exact order id. Then, click approve on the COMP.MT console!
      </p>
    </div>
    <div class="mb-4">
      <p>Total Requests: {refundRequests.length + refundedRequests.length}</p>
      <p>Pending Requests: {refundRequests.filter(r => r.refund_status === "REQUESTED").length}</p>
    </div>

    {#snippet render_component_column(column: UnifiedColumn, row: Unpacked<typeof refundRequests> )}
      {#if column.key == "actions"}
        {#if row.refund_status === 'REQUESTED'}
          <div class="flex gap-2">
            <Button
              size="xs"
              color="green"
              on:click={() => handleRefundAction(row.id, 'APPROVED')}
            >
              Approve
            </Button>
            <Button
              size="xs"
              color="red"
              on:click={() => handleRefundAction(row.id, 'DENIED')}
            >
              Deny
            </Button>
          </div>
        {:else}
          <span class="text-gray-500">No actions available</span>
        {/if}
      {/if}
    {/snippet}

    <CustomTable
      data={reshapeRefundRequest(refundRequests)}
      columns={[
        {key: "created_at", label: "Created At", visible: true, dataType: 'string'},
        ...ticket_order_columns,
      ]}
      customFields={[]}
      entityType={"ticket"}
      isLoading={loading}
      event_id={event_id}
      component_renderer={render_component_column}
    />

    <CustomTable
      data={reshapeRefundRequest(refundedRequests)}
      columns={[
        {key: "created_at", label: "Refunded At", visible: true, dataType: 'string'},
        ...ticket_order_columns,
      ]}
      customFields={[]}
      entityType={"ticket"}
      isLoading={loading}
      event_id={event_id}
      component_renderer={render_component_column}
    />

  {/if}
</div> 
