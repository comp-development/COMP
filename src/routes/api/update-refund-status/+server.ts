import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";

const eventbriteToken = env.EVENTBRITE_TOKEN;

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let ticket_id: number,
    status: "APPROVED" | "DENIED";

  try {
    body = await request.request.json();
    const r = (k: string): any => {
      if (body[k] == null) {
        throw Error(`missing key "${k}"`);
      }
      return body[k];
    };
    ticket_id = r("ticket_id");
    status = r("status");
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message, {
      status: 400,
    });
  }

  // Get the ticket order
  const { data: ticket, error: ticketError } = await adminSupabase
    .from("ticket_orders")
    .select("*")
    .eq("id", ticket_id)
    .single();

  if (ticketError || !ticket) {
    return new Response("ticket not found", { status: 404 });
  }

  if (ticket.refund_status !== "REQUESTED") {
    return new Response("ticket is not in REQUESTED status", { status: 400 });
  }

  try {
    // If it's an Eventbrite ticket and we're approving the refund, process through Eventbrite
    if (status === "APPROVED" && ticket.ticket_service === "eventbrite" && ticket.order_id) {
      try {
        const response = await fetch(
          `https://www.eventbriteapi.com/v3/orders/${ticket.order_id}/refunds/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${eventbriteToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to process Eventbrite refund");
        }
      } catch (error) {
        console.error("Eventbrite refund error:", error);
        return new Response("failed to process Eventbrite refund", { status: 400 });
      }
    }

    // Update the ticket order status
    const { error: updateError } = await adminSupabase
      .from("ticket_orders")
      .update({ refund_status: status })
      .eq("id", ticket_id);

    if (updateError) {
      throw Error("Failed to update ticket status: " + updateError.message);
    }

    // TODO: Send email notification to the organization/student about the refund status

    return new Response("success", { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new Response("failed to execute: " + e.message, { status: 400 });
  }
}; 