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
    target_org_id: number | null,
    token: string,
    eventbrite_order_id: string | null;

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
    token = r("token");
    eventbrite_order_id = r("eventbrite_order_id");
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message, {
      status: 400,
    });
  }
  console.log("BODY", body);
  console.log("EVENTBRITE_ORDER_ID", eventbrite_order_id);
  const refunding_org_ticket = target_org_id != null;

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

  if (!is_student) {
    return new Response("user is not a student", {
      status: 400,
    });
  }

  if(!eventbrite_order_id) {
    return new Response("missing eventbrite_order_id", {
      status: 400,
    });
  }



  const ticket = await adminSupabase
    .from("ticket_orders")
    .select("*", { count: "exact" })
    .eq("student_id", user.id)
    .eq("event_id", event_id)
    .eq("ticket_service", "eventbrite")
    .eq("order_id", eventbrite_order_id)
    .maybeSingle();


  if (ticket == null) {
    return new Response("user has not purchased a ticket for this event", {
      status: 400,
    });
  }
  if (ticket.data?.refund_status != "NONE") {
    return new Response("user has already requested a refund for this event", {
      status: 400
    });
  }

  // need to remove the student from a team as well
  // need the frontend to also notify that the ticket is gone, and they cannot order another one
  // maybe add in the frontend

  // need to also succesfully call the eventbrite api to make sure they can call it
  try {
    const { error: updateError } = await adminSupabase
      .from("ticket_orders")
      .update({ refund_status: "REQUESTED" })
      .eq("student_id", user.id)
      .eq("event_id", event_id);
    if (updateError) {
      throw Error("Failed to update ticket orders: " + updateError.message);
    }
  } catch (e: any) {
    console.log("ERROR", e);
    console.error(e);
    return new Response("failed to execute: " + e.message, { status: 400 });
  }



  return new Response("success", { status: 200 });
};
