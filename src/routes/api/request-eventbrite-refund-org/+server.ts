import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";
import type { Tables } from "../../../../db/database.types";
import { tick } from "svelte";

const eventbriteToken = env.EVENTBRITE_TOKEN;

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let event_id: number,
    ticket_id: number,
    org_id: number,
    token: string,
    eventbrite_order_id: string | null;
    // quantity_to_refund: number;

  try {
    body = await request.request.json();
    const r = (k: string): any => {
      if (body[k] == null) {
        throw Error(`missing key "${k}"`);
      }
      return body[k];
    };
    ticket_id = r("ticket_id");
    event_id = r("event_id");
    org_id = r("org_id");
    token = r("token");
    eventbrite_order_id = r("eventbrite_order_id");
    // quantity_to_refund = r("quantity_to_refund");
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message, {
      status: 400,
    });
  }

  const user_response = await adminSupabase.auth.getUser(token);
  if (user_response.error != null || user_response.data == null) {
    return new Response("invalid JWT credentials", { status: 400 });
  }
  const user = user_response.data.user;

  // Verify the user is a coach
  const is_coach =
    (
      await adminSupabase
        .from("coaches")
        .select("*")
        .eq("coach_id", user.id)
        .maybeSingle()
    ).data != null;

  if (!is_coach) {
    return new Response("user is not a coach", {
      status: 400,
    });
  }

  if(!eventbrite_order_id) {
    return new Response("missing eventbrite_order_id", {
      status: 400,
    });
  }

  // Get the ticket order
  const ticket = await adminSupabase
    .from("ticket_orders")
    .select("*", { count: "exact" })
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .eq("ticket_service", "eventbrite")
    .eq("order_id", eventbrite_order_id)
    .maybeSingle();

  if (!ticket.data) {
    return new Response("organization has not purchased tickets for this event", {
      status: 400,
    });
  }

  if (ticket.data.refund_status !== "NONE") {
    return new Response("organization has already requested a refund for this order", {
      status: 400,
    });
  }

  // Check if the requested refund quantity is valid
//   if (quantity_to_refund <= 0) {
//     return new Response("quantity to refund must be greater than 0", {
//       status: 400,
//     });
//   }

//   if (quantity_to_refund > ticket.data.quantity) {
//     return new Response("cannot refund more tickets than purchased", {
//       status: 400,
//     });
//   }

  // Get the number of tickets currently in use by checking student_events
  const { count: used_tickets } = (await adminSupabase
    .from("student_events")
    .select("*", { count: "exact" })
    .not("team_id", "is", null)
    .eq("org_id", org_id)
    .eq("event_id", event_id));

  console.log("used_tickets", used_tickets);
    
  // Get the total number of active tickets (sum of quantities)
  const { data: active_tickets } = await adminSupabase
    .from("ticket_orders")
    .select("quantity")
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .not("refund_status", "eq", "APPROVED")
    .not("refund_status", "eq", "REQUESTED");


  const total_active_tickets = active_tickets?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
  const available_tickets = total_active_tickets - (used_tickets || 0);

  console.log("total_active_tickets", total_active_tickets);
  console.log("used_tickets", used_tickets);
  console.log("ticket.data.quantity", ticket.data.quantity);
  if (total_active_tickets - used_tickets - ticket.data.quantity < 0) {
    return new Response(
      `cannot refund tickets as too many tickets are in use`, 
      { status: 400 }
    );
  }

  try {
    // Update the ticket order with the refund request
    const { error: updateError } = await adminSupabase
      .from("ticket_orders")
      .update({ 
        refund_status: "REQUESTED",
        // quantity: ticket.data.quantity - quantity_to_refund // Reduce the available quantity
      })
      .eq("id", ticket_id);

    if (updateError) {
      throw Error("Ticket order updated " + updateError.message);
    }

    // at some point, should add an email to the event organizers

  } catch (e: any) {
    console.error(e);
    return new Response("failed to execute: " + e.message, { status: 400 });
  }

  return new Response("success", { status: 200 });
}; 