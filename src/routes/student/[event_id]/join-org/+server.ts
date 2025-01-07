import { type RequestEvent, type RequestHandler } from "@sveltejs/kit";
import { adminSupabase } from "$lib/supabaseClient";

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let token: string, join_code: string;

  const construct_response = (response: {
    success?: {};
    failure?: { reason: string };
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

    // If the join code is for an org team, add the student to the org.
    // Fetch org_event id.
    let { data: oe_data, error: oe_error } = await adminSupabase
      .from("org_events")
      .select("id")
      .eq("join_code", join_code)
      .single();
    wrap_supabase_error("fetching org_event id", oe_data, oe_error);
    // Add student to org_event.
    let { count, error } = await adminSupabase
      .from("student_org_events")
      .upsert(
        {
          org_event_id: oe_data!.id,
          student_id: user.id,
        },
        { count: "exact" },
      );
    wrap_supabase_error("adding student to org", count, error);

    return construct_response({ success: {} });
  } catch (e: any) {
    return construct_response({
      failure: { reason: "failed to execute: " + e.message },
    });
  }
};
