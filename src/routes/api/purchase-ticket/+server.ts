// You may want to replace the above with a static private env variable
// for dead-code elimination and build-time type-checking:

const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_API_KEY;
import {
  redirect,
  type RequestEvent,
  type RequestHandler,
} from "@sveltejs/kit";
import { Stripe } from "stripe";
import type { Tables } from "../../../../db/database.types";
import { adminSupabase } from "$lib/supabaseClient";

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let event_id: number,
    token: string,
    quantity: number,
    creating_team: boolean,
    joining_team_id: string | null,
    target_org_id: number | null;
  try {
    body = await request.request.json();
    const r = (k: string): any => {
      if (body[k] == null) {
        throw Error(`missing key "${k}"`);
      }
      return body[k];
    };
    event_id = r("event_id");
    token = r("token");
    quantity = r("quantity");
    creating_team = r("creating_team");
    target_org_id = body.target_org_id;
    joining_team_id = body.joining_team_id;
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message);
  }
  const student_is_purchasing = target_org_id == null;

  const user = await adminSupabase.auth.getUser(token);
  if (user.error != null || user.data == null) {
    return new Response("invalid JWT credentials");
  }

  let redirect_url = null;
  try {
    const { data: e_data, error: e_error } = await adminSupabase
      .from("events")
      .select("event_name, ticket_price_cents")
      .eq("event_id", event_id)
      .single();
    if (e_data == null || e_error != null) {
      let msg = "obtaining event ticket price";
      if (e_error) {
        msg += ` due to (${e_error.code}) ${e_error.message} ${e_error.details} ${e_error.hint}`;
      }
      throw Error(msg);
    }
    const stripe = new Stripe(stripeSecretKey);
    const redirect = student_is_purchasing
      ? joining_team_id == null
        ? creating_team
          ? `${request.url.origin}/student/${event_id}/create-team`
          : `${request.url.origin}/coach/${event_id}`
        : `${request.url.origin}/student/${event_id}/join-team/${joining_team_id}`
      : `${request.url.origin}/student/${event_id}`;
    console.log(body, joining_team_id, creating_team, redirect);
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount: e_data.ticket_price_cents,
            product_data: {
              name: "Ticket for " + (e_data.event_name ?? "unnamed event"),
            },
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: redirect,
    });
    // Insert session id into db. Status to be checked
    let ticket_order: any = {
      event_id,
      quantity: quantity as number,
      order_id: session.id,
    };
    if (student_is_purchasing) {
      ticket_order.student_id = user.data.user.id;
    } else {
      ticket_order.org_id = target_org_id!;
    }
    const { error: to_error } = await adminSupabase
      .from("ticket_orders")
      .insert(ticket_order);

    if (to_error != null) {
      let msg = "updating ticket orders";
      if (to_error) {
        msg += ` due to (${to_error.code}) ${to_error.message}`;
      }
      throw Error(msg);
    }

    console.log(session.id);
    redirect_url = session.url;
  } catch (e: any) {
    return new Response("failed to execute: " + e.message, { status: 400 });
  }

  return new Response(redirect_url);
};
