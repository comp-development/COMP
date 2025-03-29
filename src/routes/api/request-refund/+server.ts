import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";
import type { Tables } from "../../../../db/database.types";
import { tick } from "svelte";
import { quadIn } from "svelte/easing";
import { QuadrantPlot } from "carbon-icons-svelte";

const eventbriteToken = env.EVENTBRITE_TOKEN;

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let event_id: number,
    ticket_id: number,
    refunded_tickets: number,
    message: string,
    token: string;

  console.log("REQUEST", request);
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
    refunded_tickets = r("refunded_tickets");
    token = r("token");
    message = body["message"] || "";
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message, {
      status: 400,
    });
  }

  // in order to request a refund,
  // we just create an entry in the backend database

  // if it is eventbrite, we still don't bother creating a refund request in eventbrite, we let user deal with it

  console.log("BODY", body);


  console.log("refunded, tickets", refunded_tickets);

  const user_response = await adminSupabase.auth.getUser(token);
  if (user_response.error != null || user_response.data == null) {
    return new Response("invalid JWT credentials", { status: 400 });
  }
  const user = user_response.data.user;

  const student = (
    await adminSupabase
      .from("students")
      .select("*")
      .eq("student_id", user.id)
      .maybeSingle()
  ).data;

  const coach = (
    await adminSupabase
      .from("coaches")
      .select("*")
      .eq("coach_id", user.id)
      .maybeSingle()
  ).data;

  if (coach == null && student == null) {
    return new Response("user is not a student or coach", {
      status: 400,
    });
  }

  if(refunded_tickets == 0) {
    return new Response("must refund at least one ticket", { status: 400 });
  }

  const { data: ticket, error: ticketError } = await adminSupabase
    .from("ticket_orders")
    .select("*", { count: "exact" })
    .eq("event_id", event_id)
    .eq("id", ticket_id)
    .maybeSingle();

  console.log("ticket", ticket);

  if (ticketError) {
    return new Response("ticket not found", { status: 404 });
  }
  if (ticket == null) {
    return new Response("user has not purchased a ticket for this event", {
      status: 400,
    });
  }
  if (student != null && ticket.student_id != student.student_id) {
    return new Response("user information does not match ticket", {});
  }
  // TODO: Verify that the coach has access to request refunds for this org

  // if this is an org need to perform verification that refund can be requested again
  if (ticket.org_id !== null) {
    const { count: used_tickets } = await adminSupabase
      .from("student_events")
      .select("*", { count: "exact" })
      .not("team_id", "is", null)
      .eq("org_id", ticket.org_id)
      .eq("event_id", ticket.event_id);

    // Get the total number of active tickets (sum of quantities)
    const { data: active_tickets } = await adminSupabase
      .from("ticket_orders")
      .select("quantity")
      .eq("org_id", ticket.org_id)
      .eq("event_id", ticket.event_id);

    const total_active_tickets: number =
      active_tickets?.reduce((sum, order) => sum + (order.quantity || 0), 0) ||
      0;

    const { data: already_refunded_tickets, error: refunded_tickets_error } =
      await adminSupabase
      .from("refund_requests")
      .select("quantity, ticket_orders!inner(id, org_id, event_id)") // Select id and org_id from ticket_orders
      .in("refund_status", ["PENDING", "APPROVED"])
      .eq("ticket_orders.org_id", ticket.org_id)
      .eq("ticket_orders.event_id", ticket.event_id);


    const total_refunded_tickets: number =
      already_refunded_tickets?.reduce(
        (sum, order) => sum + (order.quantity || 0),
        0
      ) || 0;
    console.log("total_active_tickets", total_active_tickets);
    console.log("total_refunded_tickets", total_refunded_tickets);
    console.log("used_tickets", used_tickets);
    console.log("refunded_tickets", refunded_tickets);

    if (
      total_active_tickets - total_refunded_tickets - used_tickets <
      refunded_tickets
    ) {
      return new Response(
        `cannot refund tickets as too many tickets are in use`,
        { status: 400 }
      );
    }
  }
  else if(ticket.student_id != null) {
    const { count: used_tickets } = await adminSupabase
        .from("student_events")
        .select("*", { count: "exact" })
        .not("team_id", "is", null)
        .eq("student_id", ticket.student_id)
        .eq("event_id", ticket.event_id);

    // Get the total number of active tickets (sum of quantities)
    const { data: active_tickets } = await adminSupabase
        .from("ticket_orders")
        .select("quantity")
        .eq("student_id", ticket.student_id)
        .eq("event_id", ticket.event_id);

    const total_active_tickets: number =
        active_tickets?.reduce((sum, order) => sum + (order.quantity || 0), 0) ||
        0;

        
    const { data: already_refunded_tickets, error: refunded_tickets_error } =
        await adminSupabase
        .from("refund_requests")
        .select("quantity, ticket_orders!inner(id, student_id, event_id)") // Select id and org_id from ticket_orders
        .in("refund_status", ["PENDING", "APPROVED"])
        .eq("ticket_orders.student_id", ticket.student_id)
        .eq("ticket_orders.event_id", ticket.event_id);

    const total_refunded_tickets: number =
        already_refunded_tickets?.reduce(
        (sum, order) => sum + (order.quantity || 0),
        0
        ) || 0;
      console.log("total_active_tickets", total_active_tickets);
      console.log("total_refunded_tickets", total_refunded_tickets);
      console.log("used_tickets", used_tickets);

    if (
        total_active_tickets - total_refunded_tickets <
        refunded_tickets
    ) {
        return new Response(
        `cannot refund tickets as too many tickets are in use`,
        { status: 400 }
        );
    }
    
  }



  // TODO?: Should ideally create an eventbrite refund request for the event

  // try to create a refund request on eventbrite as well, but it won't always work
  // will not throw error if this fails!!
  if(ticket.ticket_service == "eventbrite") {
      try {
          const email = student !== null ? student.email : coach?.email;
          const first_name = student !== null ? student.first_name : coach?.first_name;
          const last_name = student !== null ? student.last_name : coach?.last_name;
          const ev_message = "Attempting to request refund for " + refunded_tickets + " tickets";

          // using event cancellation or covid19 as reason makes full refund go through
          const refundRequestBody = {
            from_email: email,
            from_name: first_name + " " + last_name,
            items: [
              {
                order_id: ticket.order_id,
              },
            ],
            reason: "event_cancelled",
            message: ev_message,
          };

          console.log("refundRequestBody", refundRequestBody);
          const eventbriteResponse = await fetch(
            `https://www.eventbriteapi.com/v3/refund_requests/?token=${eventbriteToken}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",  // Required header
                // "Authorization": `Bearer ${eventbriteToken}` // Sometimes required
              },
              body: JSON.stringify(refundRequestBody),
            }
          );

          if (!eventbriteResponse.ok) {
            console.log("eventbriteResponse", eventbriteResponse);
            throw new Error("Failed to request refund from eventbrite");
          }
          console.log("eventbriteResponse", eventbriteResponse);
        } catch (e: any) {
          console.log("ERROR", e);
        }
  }

  // make sure no pending request exists
  const {data: oldRequests, error: oldError} = await adminSupabase
    .from("refund_requests")
    .select("*")
    .eq("ticket_id", ticket_id)
    .eq("refund_status", "PENDING");
    if(oldError) {
        console.log("updateError", oldError);
        return new Response(
        "Failed to update refund request: " + oldError.message,
        { status: 400 }
        );
    }
    if(oldRequests.length > 0) {
        return new Response(
            `cannot make new request until current requests are granted`,
            { status: 400 }
        );
    }

  // now we just create a request
  const { error: updateError } = await adminSupabase
    .from("refund_requests")
    .insert({
      ticket_id: ticket.id,
      quantity: refunded_tickets,
      refund_status: "PENDING",
      request_reason: message,
    });
    

  if (updateError) {
    console.log("updateError", updateError);
    return new Response(
      "Failed to update refund request: " + updateError.message,
      { status: 400 }
    );
  }
  return new Response("success", { status: 200 });
};
