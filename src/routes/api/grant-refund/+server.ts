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

  let refund_id : number | null;
  let refunded_tickets : number | null;

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
    // the following two are optional
    refund_id = body["refund_id"]
    refunded_tickets = body["refunded_tickets"]

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

  // either need to to respond to a refund request or tell how many refunds to grant;
  if (refund_id == null && refunded_tickets == null) {
    return new Response("missing refund_id and number of refunded_tickets", { status: 400 });
  }

  if(refund_id != null && refunded_tickets == null) {
    return new Response("missing number of refunded_tickets", { status: 400 });
  }

  const {data: event, error: eventError} = await adminSupabase
    .from("events")
    .select("*")
    .eq("id", ticket.event_id)
    .single();

  if (eventError || !event) {
    return new Response("event not found", { status: 404 });
  }


  // this means we are creating a new refund ourselves, no existing request
  if(refund_id == null && refunded_tickets != null) {
    // check the status is APPROVED
    if(status !== "APPROVED") {
      return new Response("status must be APPROVED", { status: 400 });
    }

    // if this is an org event, make sure they have enough spare tickets
    if(ticket.org_id != null) {
        const { count: used_tickets } = (await adminSupabase
            .from("student_events")
            .select("*", { count: "exact" })
            .not("team_id", "is", null)
            .eq("org_id", ticket.org_id)
            .eq("event_id", ticket.event_id));

          // Get the total number of active tickets (sum of quantities)
        const { data: active_tickets } = await adminSupabase
            .from("ticket_orders")
            .select("quantity")
            .eq("org_id", ticket.org_id)
            .eq("event_id", ticket.event_id);

        const total_active_tickets : number = active_tickets?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
        const { data: refunded_tickets, error: refunded_tickets_error } =  
            await adminSupabase
            .from("refund_requests")
            .select("quantity, ticket_orders!inner(id, org_id, event_id)") // Select id and org_id from ticket_orders
            .in("refund_status", ["PENDING", "APPROVED"])
            .eq("ticket_orders.org_id", ticket.org_id)
            .eq("ticket_orders.event_id", ticket.event_id);

        const total_refunded_tickets : number= refunded_tickets?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;
            console.log("total_active_tickets", total_active_tickets);
            console.log("total_refunded_tickets", total_refunded_tickets);
            console.log("used_tickets", used_tickets);

        if(total_active_tickets - total_refunded_tickets - used_tickets < refunded_tickets) {
          return new Response( `cannot refund tickets as too many tickets are in use`, { status: 400 });
        }
    }


    // returns how many  are available by the org 
    if(ticket.ticket_service == "eventbrite") {
      // no actual check, trust user to make sure the ticket was partially refunded
      // and that the refund_request_id was correct
      // TODO, figure out what the partial request looks like
    } else if(ticket.ticket_service == "stripe") {
        try {
            const stripe = new Stripe(stripeSecretKey);
            const session = await stripe.checkout.sessions.retrieve(ticket.order_id, {
                expand: ["payment_intent"],
              });
            
              if (!session.payment_intent || typeof session.payment_intent !== "object") {
                return new Response("Payment not found", { status: 404 });
              }
            
              const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
              const chargeId = paymentIntent.latest_charge;
            
              if (!chargeId) {
                return new Response("Charge not found", { status: 404 });
              }
              const refundAmount = refunded_tickets * event.ticket_price_cents;

              await stripe.refunds.create({
                // payment_intent: paymentIntent.id,
                charge: chargeId,
                amount: refundAmount,
              });
          } catch (stripeError: any) {
            console.log("stripeError", stripeError);
            throw new Response(`Stripe refund failed: ${stripeError.message}`, {status: 400});
          }
    } else {
      return new Response("unknown ticket service", { status: 400 });
    }

    if(ticket.student_id !== null) {
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
        // TODO, delete an emptyteam as well
    }

    const { error: updateError } = await adminSupabase
        .from("refund_requests")
        .insert({
            ticket_id: ticket.id,
            quantity: refunded_tickets,
            refund_status: status
        });

    if (updateError) {
        console.log("updateError", updateError);
        return new Response(
            ("Failed to update refund request: " + updateError.message), {status: 400}
        );
    }
  }

  // we are responding to an existing request
 // this means these tickets are already pending and we can take them out of use.
  if(refund_id != null && refunded_tickets != null) {
    let { data: refund, error: refundError } = await adminSupabase
    .from("refund_requests")
    .select("*")
    .eq("id", refund_id)
    .single();    

    if (refundError || !refund) {
      return new Response("refund request not found", { status: 404 });
    }
    
    if(refund.quantity > refunded_tickets) {
      return new Response("refund request quantity is greater than number of tickets", { status: 400 });
    }
    if(refund.refund_status !== "PENDING") {
      return new Response("refund request is not pending.", { status: 400 });
    }

    // if status is approved, actually send the money back
    if(status === "APPROVED") {
        if(ticket.ticket_service == "eventbrite") {
            // no actual check, trust user to make sure the ticket was partially refunded
        } else if(ticket.ticket_service == "stripe") {
            // sends the refund
            try {
                const stripe = new Stripe(stripeSecretKey);
                const session = await stripe.checkout.sessions.retrieve(ticket.order_id, {
                    expand: ["payment_intent"],
                  });
                
                  if (!session.payment_intent || typeof session.payment_intent !== "object") {
                    return new Response("Payment not found", { status: 404 });
                  }
                
                  const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
                  const chargeId = paymentIntent.latest_charge;
                
                  if (!chargeId) {
                    return new Response("Charge not found", { status: 404 });
                  }
                  const refundAmount = refunded_tickets * event.ticket_price_cents;
    
                  await stripe.refunds.create({
                    // payment_intent: paymentIntent.id,
                    charge: chargeId,
                    amount: refundAmount,
                  });
              } catch (stripeError: any) {
                console.log("stripeError", stripeError);
                throw new Response(`Stripe refund failed: ${stripeError.message}`, {status: 400});
              }
        }
        else {
          return new Response("unknown ticket service", { status: 400 });
        }

        if(ticket.student_id !== null) {
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
            // TODO, delete an emptyteam as well
        }
    }

    // update the refund request with the approve or deny status
    const { error: updateError } = await adminSupabase
    .from("refund_requests")
    .update({
    quantity: refunded_tickets,
    status: status
    })
    .eq("id", refund_id);
  }

  return new Response("success", { status: 200 });

}






  
