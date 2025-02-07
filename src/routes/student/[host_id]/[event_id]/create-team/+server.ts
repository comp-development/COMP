const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_API_KEY;
import { v4 as uuidv4 } from "uuid";
import {
  redirect,
  type RequestEvent,
  type RequestHandler,
} from "@sveltejs/kit";
import { Stripe } from "stripe";
import type { Tables } from "../../../../../../db/database.types";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { get } from "svelte/store";
import { page } from "$app/stores";
import { generate_join_code } from "$lib/joinCode";

const dbg = <T,>(x: T): T => {
  console.log(x);
  return x;
};

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let token: string, team_name: string, event_id: number;

  const construct_response = (response: {
    success?: { team_join_code: string };
    failure?: { reason: string; stripe_url?: string };
  }): Response => {
    if (response.success) {
      return new Response(
        JSON.stringify({ success: response.success, failure: null }),
      );
    } else if (response.failure) {
      console.error(response.failure);
      return new Response(
        JSON.stringify({ success: null, failure: response.failure }),
        { status: 400 },
      );
    }
    throw Error("bad response construction");
  };

  try {
    // Read out required parameters.
    body = await request.request.json();
    const r = (k: string): any => {
      if (body[k] == null) {
        throw Error(`missing key "${k}"`);
      }
      return body[k];
    };
    token = r("token");
    team_name = r("team_name");
    event_id = r("event_id");
  } catch (e: any) {
    return construct_response({
      failure: { reason: "missing or malformed body: " + e.message },
    });
    // return new Response(JSON.stringify({"missing or malformed body: " + e.message}));
  }

  const wrap_supabase_error = (
    ctx: string,
    data: any | null,
    error: any | null,
  ) => {
    if (data == null || error != null) {
      let msg = ctx;
      if (error) {
        msg += ` due to (${error.code}) ${error.message} ${error.details} ${error.hint}`;
      }
      throw Error(msg);
    }
  };

  try {
    // Get student user data.
    const user_response = await adminSupabase.auth.getUser(token);
    wrap_supabase_error(
      "checking JWT credentials",
      user_response.data,
      user_response.error,
    );
    const user = user_response.data.user!;

    // Make sure user isn't already in a team.
    const { data: student_event_details, error: details_error } =
      await adminSupabase
        .from("student_events")
        .select(
          "*, team:teams(*, student_event:student_events(*, student:students(*))), org_event:org_events(*, org:orgs(*))",
        )
        .eq("student_id", user.id)
        .eq("event_id", event_id)
        .maybeSingle();
    wrap_supabase_error(
      "fetching student event information",
      student_event_details,
      details_error,
    );
    if (student_event_details?.team != null) {
      return construct_response({ failure: { reason: "already in a team" } });
    }

    // Validate that session is paid.
    const { data: ticket_order, error } = await adminSupabase
      .from("ticket_orders")
      .select("*")
      .eq("student_id", user.id)
      .eq("event_id", event_id)
      .maybeSingle();
    wrap_supabase_error("fetching ticket order", ticket_order, error);
    if (!ticket_order) {
      return construct_response({
        failure: { reason: "missing payment session" },
      });
    }
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(
      ticket_order.order_id,
    );
    if (session.payment_status == "paid") {
    } else {
      if (session.status == "expired") {
        await adminSupabase
          .from("ticket_orders")
          .delete()
          .eq("student_id", user.id)
          .eq("event_id", event_id);
        return construct_response({
          failure: { reason: "payment expired", stripe_url: session.url! },
        });
      }
      return construct_response({
        failure: { reason: "payment not complete", stripe_url: session.url! },
      });
    }

    // Create team and return join code.
    const join_code = generate_join_code();
    const { data: t_data, error: t_error } = dbg(
      await adminSupabase
        .from("teams")
        .insert({
          event_id,
          org_id: null,
          join_code,
          team_name,
        })
        .select("team_id"),
    );
    wrap_supabase_error("creating team in database", t_data, t_error);
    return construct_response({ success: { team_join_code: join_code } });
  } catch (e: any) {
    return construct_response({
      failure: { reason: "failed to execute: " + e.message },
    });
  }
};
