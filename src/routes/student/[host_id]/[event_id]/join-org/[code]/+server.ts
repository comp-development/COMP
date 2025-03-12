import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";

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
      "You are not registered for this tournament. You must register before joining this organization",
      student_event_details,
      details_error,
    );

    if (student_event_details?.org_id != null) {
      return construct_response({ failure: { reason: "You are already in another organization" } });
    }

    if (student_event_details?.team_id != null) {
      return construct_response({ failure: { reason: "You are already in an independent team" } });
    }

    let { data: organization_data, error: organization_error } = await adminSupabase
      .from("org_events")
      .select("*, orgs(*)")
      .eq("join_code", join_code)
      .maybeSingle();
    wrap_supabase_error(
      "fetching organization id for join code. Organization may not exist",
      organization_data,
      organization_error,
    );

    let { error } = await adminSupabase.from("student_events").upsert(
      {
        event_id,
        student_id: user.id,
        org_id: organization_data.org_id,
      },
      { onConflict: "event_id, student_id" },
    );
    wrap_supabase_error("adding student to organization error", 0, error);

    return construct_response({ success: { team_join_code: join_code } });
  } catch (e: any) {
    return construct_response({
      failure: { reason: "Failed to execute: " + e.message },
    });
  }
};
