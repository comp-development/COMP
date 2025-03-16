import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { Stripe } from "stripe";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";
import { removeUserInvitationFromTeam } from "$lib/supabase";

const stripeSecretKey = env.STRIPE_SECRET_API_KEY;

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
          "*, team:teams(*, student_event:student_events(*, student:students(*))), org_event:org_events(*, org:orgs(*)), event:events(*)",
        )
        .eq("student_id", user.id)
        .eq("event_id", event_id)
        .maybeSingle();
    wrap_supabase_error(
      "You are not registered for this tournament",
      student_event_details,
      details_error,
    );

    if (student_event_details?.team != null) {
      return construct_response({ failure: { reason: "You are already in a team" } });
    }

    let { data: team_data, error: team_error } = await adminSupabase
      .from("teams")
      .select("team_id, org_id, team_members:student_events(*)")
      .eq("join_code", join_code)
      .maybeSingle();
    wrap_supabase_error(
      "fetching team id for join code. Team may not exist",
      team_data,
      team_error,
    );
    
    if (team_data.org_id != (student_event_details.org_event ? student_event_details.org_event.org_id : null)) {
      throw new Error("This team is not associated with this organization");
    }

    if (team_data.team_members.length >= student_event_details.event.max_team_size) {
      throw new Error("Team is full");
    }

    // If the join code is for an org team, add the student to the org.
    if (team_data!.org_id) {
      // Add student to org_event.
      let { error } = await adminSupabase.from("student_events").upsert(
        {
          event_id,
          student_id: user.id,
          org_id: team_data!.org_id,
        },
        { onConflict: "event_id, student_id" },
      );
      wrap_supabase_error("adding student to org", 0, error);
    }

    // Validate that session is paid.
    let { data: ticket_order, error } = await adminSupabase
      .from("ticket_orders")
      .select("*")
      .eq("student_id", user.id)
      .eq("event_id", event_id)
      .maybeSingle();
    wrap_supabase_error("fetching ticket order", 0, error);

    // If using an org order, provide a nice error if there are
    // insufficient purchased tickets.
    if (team_data!.org_id) {
      // TODO: check logic if on org team but paid for own ticket.
      const { count: used_quantity, error: st_error } = await adminSupabase
        .from("student_events")
        .select("*, teams!inner(*)", { count: "exact" })
        .eq("event_id", event_id)
        .eq("teams.org_id", team_data!.org_id);
      wrap_supabase_error(
        "counting uses of org id ticket",
        used_quantity,
        st_error,
      );
      // Assume the # of ticket orders isn't too large.
      const { data: tickets, error: to_error } = await adminSupabase
        .from("ticket_orders")
        .select("*")
        .eq("org_id", team_data!.org_id);
      wrap_supabase_error(
        "counting available org id tickets",
        tickets,
        to_error,
      );

      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
      const purchased_quantity = sum(tickets!.map((t) => t.quantity));
      if (purchased_quantity <= used_quantity!) {
        return construct_response({
          failure: { reason: "joined org, insufficient org tickets" },
        });
      }
    } else {
      // If not using an org order, provide nice errors for varying payment statuses.
      if (!ticket_order) {
        return construct_response({
          failure: { reason: "missing payment session" },
        });
      }

      if (ticket_order.ticket_service == "stripe") {
        const stripe = new Stripe(stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(
          ticket_order.order_id,
        );

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
        if (session.payment_status != "paid") {
          return construct_response({
            failure: {
              reason: "payment not complete",
              stripe_url: session.url!,
            },
          });
        }
      }
      // We need no check for eventbrite - the eventbrite ticket order is only
      // inserted AFTER payment is complete.
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
    wrap_supabase_error("adding student to team", 0, student_team_error);

    await removeUserInvitationFromTeam(Number(team_data!.team_id), user.email + "");

    return construct_response({ success: { team_join_code: join_code } });
  } catch (e: any) {
    return construct_response({
      failure: { reason: "Failed to execute: " + e.message },
    });
  }
};
