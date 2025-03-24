import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";
import { P } from "flowbite-svelte";
import { Stripe } from "stripe";

// const eventbriteToken = env.EVENTBRITE_TOKEN;
const stripeSecretKey = env.STRIPE_SECRET_API_KEY;
const eventbriteToken = env.EVENTBRITE_TOKEN;

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let ticket_id: number, status: "APPROVED" | "DENIED";

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

  if (status !== "APPROVED" && status !== "DENIED") {
    return new Response("status must be APPROVED or DENIED", { status: 400 });
  }

  if (status === "APPROVED") {
    if (ticket.ticket_service === "stripe") {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(
          ticket.order_id
        );
        if (!session.payment_intent) throw new Error("No payment intent found");
        let refund;
        // Process refund via Stripe
        refund = await stripe.refunds.create({
          payment_intent: session.payment_intent as string,
          reason: "requested_by_customer",
        });
      } catch (stripeError: any) {
        throw new Error(`Stripe refund failed: ${stripeError.message}`);
      }
    } else {
      if (ticket.ticket_service !== "eventbrite") {
        throw Error("Unknown ticket service: " + ticket.ticket_service);
      } else {
        // if this is eventbrite
        // call eventbrite api, parse through compelted refunds nad make sure status is refunded
        const eventbriteResponse = await fetch(
          `https://www.eventbriteapi.com/v3/orders/${ticket.order_id}/?token=${eventbriteToken}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",  // Required header
            },
          }
        );

        if (!eventbriteResponse.ok) {
          throw Error(`Eventbrite refund failed: ${eventbriteResponse.statusText}`);
        }

        const eventbriteData = await eventbriteResponse.json();
        if (eventbriteData?.status !== "refunded") {
          throw Error("Event is not yet refunded on Eventbrite portal. Please login to the portal to refund it first!");
        }
      }
    }
    if(ticket.student_id !== null) {
      // should delete their entry from the event
      const { error: deleteError } = await adminSupabase
      .from("student_events")
      .delete()
      .eq("student_id", ticket.student_id)
      .eq("event_id", ticket.event_id);

      if (deleteError) {
        throw Error("Failed to delete student-event entry: " + deleteError.message);
      }

      // should delete their entry from the ticket_orders_Table
      const { error: deleteError2 } = await adminSupabase
      .from("ticket_orders")
      .delete()
      .eq("student_id", ticket.student_id)
      .eq("event_id", ticket.event_id);

      if (deleteError2) {
        throw Error("Failed to delete student ticket entry: " + deleteError2.message);
      }

      // for book keepings sake, should also store their entry permanently in another table
      const { error: insertError } = await adminSupabase
      .from("refunded_ticket_orders")
      .insert({
        id: ticket.id,
        student_id: ticket.student_id,
        event_id: ticket.event_id,
        refund_status: status,
        quantity: ticket.quantity,
        order_id: ticket.order_id
      });

      if (insertError) {
        throw Error("Failed to insert into approved refunds table: " + insertError.message);
      }
    }

    // regardless of ticket service, if this is a student,
    // we need to remove them from the event, by moving the ticket to the other table
    // we need to delete their entry in the student-events table 


    // just set the status
    // for coaches, just change status to approved, should by default just work
  }
  // else {
  //   // next part will just set the status anyway.
  // }
  if( status === "DENIED") {
    try {
      // If it's an Eventbrite ticket and we're approving the refund, process through Eventbrite
      // Update the ticket order status
      const { error: updateError } = await adminSupabase
        .from("ticket_orders")
        .update({ refund_status: status })
        .eq("id", ticket_id);
  
      if (updateError) {
        throw Error("Failed to update ticket status: " + updateError.message);
      }
      // TODO: Send email notification to the organization/student about the refund status
      // return new Response("success", { status: 200 });
    } catch (e: any) {
      console.error(e);
      return new Response("failed to execute: " + e.message, { status: 400 });
    }
  }

  return new Response("success", { status: 200 });
  

  
};
