import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";
import { P } from "flowbite-svelte";
import { Stripe } from "stripe";

// const eventbriteToken = env.EVENTBRITE_TOKEN;
const stripeSecretKey = env.STRIPE_SECRET_API_KEY;

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


  if(status === "APPROVED") {
    
  }
  if(ticket.ticket_service === "stripe") {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(ticket.order_id);
        if (!session.payment_intent) throw new Error("No payment intent found");
        let refund;
          // Process refund via Stripe
        refund = await stripe.refunds.create({
          payment_intent: session.payment_intent as string,
          reason: "requested_by_customer",
        });
      }
      catch (stripeError: any) {
        throw new Error(`Stripe refund failed: ${stripeError.message}`);
      }
  }
  else {
      if(ticket.ticket_service !== "eventbrite") {
        throw Error("Unknown ticket service: " + ticket.ticket_service);
     }
     else {
       // call eventbrite api, parse through compelted refunds nad make sure status is refunded
     }
  }

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
    return new Response("success", { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new Response("failed to execute: " + e.message, { status: 400 });
  }
}; 