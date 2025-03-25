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

    // actually approve the refunf using stripe, or check its been approved via eventbrite
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
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);
        console.log("stripeError", stripeError);

        throw new Response(`Stripe refund failed: ${stripeError.message}`, {status: 400});
      }
    } else if (ticket.ticket_service === "eventbrite") {
      const eventbriteResponse = await fetch(
        `https://www.eventbriteapi.com/v3/orders/${ticket.order_id}/?token=${eventbriteToken}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json", // Required header
          },
        }
      );

      if (!eventbriteResponse.ok) {
        console.log("eventbriteResponse", eventbriteResponse.statusText);

        return new Response(
          `Eventbrite refund failed: ${eventbriteResponse.statusText}`, {status: 400}
        );
      }

      const eventbriteData = await eventbriteResponse.json();
      if (eventbriteData?.status !== "refunded") {
        console.log("eventbriteData", eventbriteData);
        return new Response(
          "Event is not yet refunded on Eventbrite portal. Please login to the portal to refund it first!", {status: 400}
        );
      }
    } else {
      return new Response(("Unknown ticket service: " + ticket.ticket_service), {status: 400});
    }

    // if this is a student ticket, need to delete registration from events
    if (ticket.student_id !== null) {
      // grab the team they are being removed from
      const { data: team_info, error: ticketError } = await adminSupabase
        .from("student_events")
        .select("team_id, teams(team_name)")  // Fetch team name via relationship
        .eq("student_id", ticket.student_id)
        .eq("event_id", ticket.event_id)
        .single();

      // should delete their entry from the event
      const { error: deleteError } = await adminSupabase
        .from("student_events")
        .delete()
        .eq("student_id", ticket.student_id)
        .eq("event_id", ticket.event_id);
  
      if (deleteError) {
        console.log("deleteError", deleteError);
        return new Response(
          ("Failed to delete student-event entry: " + deleteError.message), {status: 400}
        );
      }
  
      // should delete their entry from the ticket_orders_Table
      const { error: deleteError2 } = await adminSupabase
        .from("ticket_orders")
        .delete()
        .eq("student_id", ticket.student_id)
        .eq("event_id", ticket.event_id);
  
      if (deleteError2) {
        console.log("deleteError2", deleteError2);
        return new Response(
          ("Failed to delete student ticket entry: " + deleteError2.message), {status: 400}
        );
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
          order_id: ticket.order_id,
          removed_team: team_info?.teams?.team_name,
        });

      //TODO: shoould also delete the students info from the table
      // TODO: Update team count if team is empty

  
      if (insertError) {
        return new Response(
          "Failed to insert into approved refunds table: " + insertError.message, {status: 400}
        );
      }
    }

  }

  

  // regardless of ticket service, if this is a student,
  // we need to remove them from the event, by moving the ticket to the other table
  // we need to delete their entry in the student-events table

  // just set the status
  // for coaches, just change status to approved, should by default just work
  // else {
  //   // next part will just set the status anyway.
  // }
  if (status === "DENIED" || ticket.org_id !== null) {
    try {
      const { error: updateError } = await adminSupabase
        .from("ticket_orders")
        .update({ refund_status: status })
        .eq("id", ticket_id);

      if (updateError) {
        return new Response(("Failed to update ticket status: " + updateError.message), { status: 400 });
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
