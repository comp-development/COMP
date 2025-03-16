import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";

const eventbriteToken = env.EVENTBRITE_TOKEN;

export const POST: RequestHandler = async (request: RequestEvent) => {
  try {
    const body = await request.request.json();
    const { event_id, order_id, reason, token } = body;

    // Validate user
    const user_response = await adminSupabase.auth.getUser(token);
    if (user_response.error != null || user_response.data == null) {
      return new Response("invalid JWT credentials", { status: 400 });
    }
    const user = user_response.data.user;

    // Get event details
    const { data: eventData, error: eventError } = await adminSupabase
      .from("events")
      .select(`
        event_name,
        email,
        eventbrite_event_id,
        host (
          email
        )
      `)
      .eq("event_id", event_id)
      .single();

    if (eventError || !eventData) {
      throw new Error("Failed to fetch event details");
    }

    // Get student details
    const { data: studentData, error: studentError } = await adminSupabase
      .from("students")
      .select("first_name, last_name, email")
      .eq("student_id", user.id)
      .single();

    if (studentError || !studentData) {
      throw new Error("Failed to fetch student details");
    }

    // Make refund request to Eventbrite
    const refundRequestBody = {
      from_email: studentData.email,
      from_name: `${studentData.first_name} ${studentData.last_name}`,
      items: [
        {
          order_id: order_id,
          event_id: eventData.eventbrite_event_id
        }
      ],
      reason: "other", // Using "other" since we want to provide a custom message
      message: reason // Using the student's provided reason as the message
    };

    const refundResponse = await fetch(
      `https://www.eventbriteapi.com/v3/refund_requests/?token=${eventbriteToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(refundRequestBody)
      }
    );

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json();
      throw new Error(`Failed to submit refund request to Eventbrite: ${JSON.stringify(errorData)}`);
    }

    const refundData = await refundResponse.json();

    // Send confirmation email to event organizer
    const emailContent = {
      to: eventData.email || eventData.host.email,
      subject: `Refund Request for ${eventData.event_name}`,
      html: `
        <h2>Refund Request Details</h2>
        <p><strong>Event:</strong> ${eventData.event_name}</p>
        <p><strong>Student:</strong> ${studentData.first_name} ${studentData.last_name} (${studentData.email})</p>
        <p><strong>Order ID:</strong> ${order_id}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Eventbrite Refund Request ID:</strong> ${refundData.id}</p>
        <p>The refund request has been submitted to Eventbrite. You can process this request through your Eventbrite dashboard.</p>
      `
    };

    // Send email using your email service
    // Note: You'll need to implement the actual email sending logic based on your email service provider
    
    return new Response(JSON.stringify({ 
      success: true,
      refund_request_id: refundData.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Error processing refund request:", error);
    return new Response(JSON.stringify({ error: "Failed to process refund request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}; 





// You may want to replace the above with a static private env variable
// for dead-code elimination and build-time type-checking:

import {
    redirect,
    type RequestEvent,
    type RequestHandler,
  } from "@sveltejs/kit";
  import { Stripe } from "stripe";
  import type { Tables } from "../../../../db/database.types";
  import { adminSupabase } from "$lib/adminSupabaseClient";
  import { env } from "$env/dynamic/private";
  
  const eventbriteToken = env.EVENTBRITE_TOKEN;
  
  export const POST: RequestHandler = async (request: RequestEvent) => {
    let body: any | null = null;
    let event_id: number,
      host_id: number,
      creating_team: boolean,
      joining_team_code: string | null,
      target_org_id: number | null,
      token: string,
      eventbrite_order_id: string | null;
  
    try {
      body = await request.request.json();
      const r = (k: string): any => {
        if (body[k] == null) {
          throw Error(`missing key "${k}"`);
        }
        return body[k];
      };
      event_id = r("event_id");
      host_id = r("host_id");
      token = r("token");
      creating_team = r("creating_team");
      eventbrite_order_id = r("eventbrite_order_id");
      target_org_id = body.target_org_id;
      joining_team_code = body.joining_team_code;
    } catch (e: any) {
      return new Response("missing or malformed body: " + e.message, {
        status: 400,
      });
    }
    console.log("BODY", body)
    console.log("EVENTBRITE_ORDER_ID", eventbrite_order_id)
    const purchasing_org_ticket = target_org_id != null;
  
    const user_response = await adminSupabase.auth.getUser(token);
    if (user_response.error != null || user_response.data == null) {
      return new Response("invalid JWT credentials", { status: 400 });
    }
    const user = user_response.data.user;
  
    const is_student =
      (
        await adminSupabase
          .from("students")
          .select("*")
          .eq("student_id", user.id)
          .maybeSingle()
      ).data != null;
    if (is_student && purchasing_org_ticket) {
      return new Response("student attempting to purchase org ticket", {
        status: 400,
      });
    }
    if (!is_student && !purchasing_org_ticket) {
      return new Response("org attempting to purchase student ticket", {
        status: 400,
      });
    }
  
    const transaction_stored =
      (
        await adminSupabase
          .from("ticket_orders")
          .select("*", { count: "exact" })
          .eq("student_id", user.id)
          .eq("event_id", event_id)
      ).count == 1 ||
      (purchasing_org_ticket &&
        (
          await adminSupabase
            .from("ticket_orders")
            .select("*", { count: "exact" })
            .eq("org_id", target_org_id!)
            .eq("event_id", event_id)
        ).count) == 1;
  
    if (transaction_stored) {
      if (is_student) {
        // Doing this instead of returning a redirect b/c local dev is http
        // and CORS doesn't like redirects.
        return new Response(`/student/${event_id}`);
      }
    }

    console.log("Log1")
  
    let redirect_url = null;
    try {
      redirect_url = creating_team
        ? `${request.url.origin}/student/${host_id}/${event_id}/create-team`
        : joining_team_code
          ? `${request.url.origin}/student/${host_id}/${event_id}/join-team/${joining_team_code}`
          : target_org_id
            ? `${request.url.origin}/coach/${target_org_id}/${host_id}/${event_id}`
            : // This case shouldn't be hit.
              (() => {
                console.error("unexpected request state", body);
                throw Error("unexpected request state");
              })();
      
      if (eventbrite_order_id) {
        console.log("Log2")
        let attendeesData: any[] = [];
        let pageNumber = 1;
        let hasMoreItems = true;

        while (hasMoreItems) {
            const eventbriteResponse = await fetch(`https://www.eventbriteapi.com/v3/orders/${eventbrite_order_id}/attendees/?token=${eventbriteToken}&page=${pageNumber}`, {
                method: "GET",
            });
            console.log("Log3", eventbriteResponse);
            const data = await eventbriteResponse.json();
            if (!data || data.error) {
                throw Error("Failed to fetch attendees from Eventbrite");
            }

            attendeesData = attendeesData.concat(data.attendees); // Combine current page attendees with the total
            hasMoreItems = data.pagination.has_more_items; // Check if there are more pages
            pageNumber++; // Increment page number for the next request
        }

        const existingOrder = await adminSupabase
          .from("ticket_orders")
          .select("*")
          .eq("order_id", eventbrite_order_id)
          .maybeSingle();
        
        if (existingOrder.data) {
          // Update existing order
          const { error: updateError } = await adminSupabase
            .from("ticket_orders")
            .update({ quantity: attendeesData.length })
            .eq("order_id", eventbrite_order_id);
          if (updateError) {
            throw Error("Failed to update ticket orders: " + updateError.message);
          }
        } else {
          // Create new order
          const ticket_order = {
            event_id,
            quantity: attendeesData.length,
            order_id: eventbrite_order_id,
            ticket_service: "eventbrite"
          } as Tables<"ticket_orders">;
          if (!purchasing_org_ticket) {
            ticket_order.student_id = user.id;
          } else {
            ticket_order.org_id = target_org_id!;
          }
          const { error: insertError } = await adminSupabase
            .from("ticket_orders")
            .insert(ticket_order);
          if (insertError) {
            throw Error("Failed to insert ticket order: " + insertError.message);
          }
        }
      }
    } catch (e: any) {
      console.log("ERROR", e);
      console.error(e);
      return new Response("failed to execute: " + e.message, { status: 400 });
    }
  
    return new Response(redirect_url);
  };
