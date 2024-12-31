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
    joining_team_code: string | null,
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
    joining_team_code = body.joining_team_id;
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message);
  }
  const purchasing_org_ticket = target_org_id != null;

  const user_response = await adminSupabase.auth.getUser(token);
  if (user_response.error != null || user_response.data == null) {
    return new Response("invalid JWT credentials", { status: 400 });
  }
  const user = user_response.data.user;

  const dbg = <T,>(x: T): T => {
    console.log(x);
    return x;
  };
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
    // TODO: handle if org already has ticket transaction
  }

  // TODO: check that if purchasing org ticket, that the user is a coach for that org

  let redirect_url = null;
  try {
    if (is_student && quantity != 1) {
      throw Error("student may not purchase more than one ticket");
    }

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
    const { ticket_price_cents, event_name } = e_data;

    const stripe = new Stripe(stripeSecretKey);
    const redirect = creating_team
      ? `${request.url.origin}/student/${event_id}/create-team`
      : joining_team_code
        ? `${request.url.origin}/student/${event_id}/join-team/${joining_team_code}`
        : target_org_id
          ? `${request.url.origin}/coach/${event_id}`
          : // This case shouldn't be hit.
            (() => {
              throw Error("unexpected request state");
            })();
    const cancel_url =
      request.url.origin + (target_org_id ? "/coach/" : "/student/") + event_id;
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount: ticket_price_cents,
            product_data: {
              name: "Ticket for " + (event_name ?? "unnamed event"),
            },
          },
          quantity,
        },
      ],
      mode: "payment",
      success_url: redirect,
      cancel_url,
    });

    // Insert session id into db. Status to be checked
    let ticket_order: any = {
      event_id,
      quantity: quantity as number,
      order_id: session.id,
    };
    if (!purchasing_org_ticket) {
      ticket_order.student_id = user.id;
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

    redirect_url = session.url;
  } catch (e: any) {
    return new Response("failed to execute: " + e.message, { status: 400 });
  }

  return new Response(redirect_url);
};
