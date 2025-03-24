<script lang="ts">
  import { page } from "$app/stores";
  import { getEventRefundRequests, getEventRefundedRequests } from "$lib/supabase";
  import { handleError } from "$lib/handleError";
  import { Button, Badge, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from "flowbite-svelte";
  import type { Tables } from "$lib/types/database.types";
  const event_id = parseInt($page.params.event_id);
  let loading = true;
  let refundRequests: Tables<"ticket_orders">[] = [];
  let refundedRequests: Tables<"refunded_ticket_order">[] = [];

  (async () => {
    console.log("LOADING", loading);
    try {
      console.log("Fetching refund requests for event:", event_id);
      let body = {
            event_id,
          };
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
        throw new Error("Failed to update refund status");
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
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">Refund Requests</h1>

  {#if loading}
    <p>Loading refund requests...</p>
  {:else}
    {#if refundRequests.length > 0}
    <div class="mb-4">
      <p> Before accepting a refund request via eventbrite, please make sure to go to the eventbrite portal
        and manually approve the refund for this exact order id. Then, click approve on the COMP.MT console!
      </p>
    </div>
    {/if}
    <div class="mb-4">
      <p>Total Requests: {refundRequests.length}</p>
      <p>Pending Requests: {refundRequests.filter(r => r.refund_status === "REQUESTED").length}</p>
    </div>

    {#if refundRequests.length + refundedRequests.length === 0}
      <p>No refund requests found.</p>
    {:else}
      <Table>
        <TableHead>
          <TableHeadCell>Order ID</TableHeadCell>
          <TableHeadCell>Ticket Service</TableHeadCell>
          <TableHeadCell>Requested By</TableHeadCell>
          <TableHeadCell>Quantity</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Requested At</TableHeadCell>
          <TableHeadCell>Actions</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each refundRequests.filter(r => r.refund_status === "REQUESTED") as request}
            <TableBodyRow>
              <TableBodyCell>{request.order_id}</TableBodyCell>
              <TableBodyCell>{request.ticket_service}</TableBodyCell>
              <TableBodyCell>{request.student_id ? request.students.first_name + " " + request.students.last_name : request.orgs.name}</TableBodyCell>
              <TableBodyCell>{request.quantity}</TableBodyCell>
              <TableBodyCell>
                <Badge
                  color={request.refund_status === 'REQUESTED' ? 'yellow' : 
                         request.refund_status === 'APPROVED' ? 'green' : 
                         request.refund_status === 'DENIED' ? 'red' : 'dark'}
                >
                  {request.refund_status}
                </Badge>
              </TableBodyCell>
              <TableBodyCell>
                {new Date(request.created_at).toLocaleDateString()}
              </TableBodyCell>
              <TableBodyCell>
                {#if request.refund_status === 'REQUESTED'}
                  <div class="flex gap-2">
                    <Button
                      size="xs"
                      color="green"
                      on:click={() => handleRefundAction(request.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      on:click={() => handleRefundAction(request.id, 'DENIED')}
                    >
                      Deny
                    </Button>
                  </div>
                {:else}
                  <span class="text-gray-500">No actions available</span>
                {/if}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>

      <div class="mt-4">
        <p>Approved Refunds: {refundedRequests.length}</p>
      </div>

      <Table>
        <TableHead>
          <TableHeadCell>Order ID</TableHeadCell>
          <TableHeadCell>Ticket Service</TableHeadCell>
          <TableHeadCell>Requested By</TableHeadCell>
          <TableHeadCell>Quantity</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Requested At</TableHeadCell>
          <TableHeadCell>Actions</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each refundedRequests as request}
            <TableBodyRow>
              <TableBodyCell>{request.order_id}</TableBodyCell>
              <TableBodyCell>{request.ticket_service}</TableBodyCell>
              <TableBodyCell>{request.student_id ? request.students.first_name + " " + request.students.last_name : request.orgs.name}</TableBodyCell>
              <TableBodyCell>{request.quantity}</TableBodyCell>
              <TableBodyCell>
                <Badge
                  color={request.refund_status === 'REQUESTED' ? 'yellow' : 
                         request.refund_status === 'APPROVED' ? 'green' : 
                         request.refund_status === 'DENIED' ? 'red' : 'dark'}
                >
                  {request.refund_status}
                </Badge>
              </TableBodyCell>
              <TableBodyCell>
                {new Date(request.created_at).toLocaleDateString()}
              </TableBodyCell>
              <TableBodyCell>
                {#if request.refund_status === 'REQUESTED'}
                  <div class="flex gap-2">
                    <Button
                      size="xs"
                      color="green"
                      on:click={() => handleRefundAction(request.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      on:click={() => handleRefundAction(request.id, 'DENIED')}
                    >
                      Deny
                    </Button>
                  </div>
                {:else}
                  <span class="text-gray-500">No actions available</span>
                {/if}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>

      <div class="mt-4">
        <p>Approved Refunds: {refundedRequests.length}</p>
      </div>
      <Table>
        <TableHead>
          <TableHeadCell>Order ID</TableHeadCell>
          <TableHeadCell>Ticket Service</TableHeadCell>
          <TableHeadCell>Requested By</TableHeadCell>
          <TableHeadCell>Quantity</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell>Requested At</TableHeadCell>
          <TableHeadCell>Actions</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each refundRequests.filter(r => r.refund_status === "DENIED") as request}
            <TableBodyRow>
              <TableBodyCell>{request.order_id}</TableBodyCell>
              <TableBodyCell>{request.ticket_service}</TableBodyCell>
              <TableBodyCell>{request.student_id ? request.students.first_name + " " + request.students.last_name : request.orgs.name}</TableBodyCell>
              <TableBodyCell>{request.quantity}</TableBodyCell>
              <TableBodyCell>
                <Badge
                  color={request.refund_status === 'REQUESTED' ? 'yellow' : 
                         request.refund_status === 'APPROVED' ? 'green' : 
                         request.refund_status === 'DENIED' ? 'red' : 'dark'}
                >
                  {request.refund_status}
                </Badge>
              </TableBodyCell>
              <TableBodyCell>
                {new Date(request.created_at).toLocaleDateString()}
              </TableBodyCell>
              <TableBodyCell>
                {#if request.refund_status === 'REQUESTED'}
                  <div class="flex gap-2">
                    <Button
                      size="xs"
                      color="green"
                      on:click={() => handleRefundAction(request.id, 'APPROVED')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      on:click={() => handleRefundAction(request.id, 'DENIED')}
                    >
                      Deny
                    </Button>
                  </div>
                {:else}
                  <span class="text-gray-500">No actions available</span>
                {/if}
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    {/if}
  {/if}
</div> 