const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_API_KEY;
import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { Stripe } from "stripe";
import { adminSupabase } from "$lib/adminSupabaseClient";

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let token: string, join_code: string, event_id: number;

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
    join_code = r("join_code");
    event_id = r("event_id");
  } catch (e: any) {
    return construct_response({
      failure: { reason: "missing or malformed body: " + e.message },
    });
  }

  const wrap_supabase_error = (
    ctx: string,
    data: any | null,
    error: any | null,
  ) => {
    if (data == null || error != null) {
      let msg = ctx;
      if (error) {
        msg += ` due to (${error.code}) ${error.message ?? ""} ${
          error.details ?? ""
        } ${error.hint ?? ""}`;
      }
      throw Error(msg);
    }
  };

  //   /student/[event_id]/join-team/[join_code] POST
  // - if join code is org's team: add student to org
  // - if have student payment entry, check that payment status is good
  // - else, check that team's org's payment status is good and sufficient seats
  // ===============TODO===============
  //  add back join codes to org teams
  // ==================================
  // - add student to team

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

    let { data: team_data, error: team_error } = await adminSupabase
      .from("teams")
      .select("team_id, org_id")
      .eq("join_code", join_code)
      .single();
    wrap_supabase_error("fetching team id", team_data, team_error);

    let joined_org = false;
    // If the join code is for an org team, add the student to the org.
    if (team_data!.org_id) {
      // Add student to org_event.
      let { error } = await adminSupabase.from("student_events").upsert({
        event_id,
        student_id: user.id,
        org_id: team_data!.org_id,
      });
      wrap_supabase_error("adding student to org", 0, error);
      joined_org = true;
    }

    // Validate that session is paid.
    let { data: ticket_order, error } = await adminSupabase
      .from("ticket_orders")
      .select("*")
      .eq("student_id", user.id)
      .eq("event_id", event_id)
      .maybeSingle();
    wrap_supabase_error("fetching ticket order", ticket_order, error);

    let using_org_order = false;
    // Use org session if student's does not exist.
    if (!ticket_order) {
      let { data: org_ticket_order, error } = await adminSupabase
        .from("ticket_orders")
        .select("*")
        .eq("student_id", user.id)
        .eq("event_id", event_id)
        .maybeSingle();
      wrap_supabase_error("fetching ticket order", org_ticket_order, error);
      ticket_order = org_ticket_order;
      using_org_order = true;
    }

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

    // Add student to team.
    let { error: student_team_error } = await adminSupabase
      .from("student_events")
      .upsert(
        {
          student_id: user.id,
          team_id: team_data!.team_id,
          event_id,
        },
        { onConflict: "student_id, event_id" },
      );

    // If using an org order, provide a nice error if there are
    // insufficient purchased tickets.
    if (using_org_order && joined_org && student_team_error) {
      const { count: used_quantity, error: st_error } = await adminSupabase
        .from("student_events")
        .select("*, teams!inner(*, student_events(*))", { count: "exact" })
        .eq("ticket_order_id", ticket_order.id);
      wrap_supabase_error(
        "counting uses of org id ticket",
        used_quantity,
        st_error,
      );
      const purchased_quantity = session!.line_items!.data[0].quantity;
      if (purchased_quantity == used_quantity) {
        return construct_response({
          failure: { reason: "joined org, insufficient org tickets" },
        });
      }
    }
    wrap_supabase_error("adding student to team", 0, student_team_error);

    return construct_response({ success: { team_join_code: join_code } });
  } catch (e: any) {
    return construct_response({
      failure: { reason: "failed to execute: " + e.message },
    });
  }
};
