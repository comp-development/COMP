import {
  redirect,
  type RequestEvent,
  type RequestHandler,
} from "@sveltejs/kit";
import { Stripe } from "stripe";
// Skip this import for now since it's causing problems
// import type { Tables } from "../../../db/database.types";
import { adminSupabase } from "$lib/adminSupabaseClient";
import { env } from "$env/dynamic/private";

const stripeSecretKey = env.STRIPE_SECRET_API_KEY;

export const POST: RequestHandler = async (request: RequestEvent) => {
  let body: any | null = null;
  let event_id: number,
    host_id: number,
    token: string,
    addons: {addon_id: string, quantity: number}[],
    student_event_id: number | null,
    team_id: number | null,
    org_event_id: number | null;

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
    addons = r("addons");
    student_event_id = body.student_event_id || null;
    team_id = body.team_id || null;
    org_event_id = body.org_event_id || null;

    // Ensure exactly one of student_event_id, team_id, or org_event_id is provided
    const count = (student_event_id ? 1 : 0) + (team_id ? 1 : 0) + (org_event_id ? 1 : 0);
    if (count !== 1) {
      throw Error("Exactly one of student_event_id, team_id, or org_event_id must be provided");
    }
  } catch (e: any) {
    return new Response("missing or malformed body: " + e.message, {
      status: 400,
    });
  }

  const user_response = await adminSupabase.auth.getUser(token);
  if (user_response.error != null || user_response.data == null) {
    return new Response("invalid JWT credentials", { status: 400 });
  }
  const user = user_response.data.user;

  let redirect_url = null;
  try {
    // Get add-ons information
    const { data: addon_data, error: addon_error } = await adminSupabase
      .from("addons")
      .select("*")
      .eq("event_id", event_id)
      .eq("enabled", true)
      .in("addon_id", addons.map(a => a.addon_id));

    if (addon_error || !addon_data || addon_data.length === 0) {
      let msg = "Error retrieving add-ons";
      if (addon_error) {
        msg += ` due to (${addon_error.code}) ${addon_error.message}`;
      }
      throw Error(msg);
    }

    // Get event information for the name
    const { data: event_data, error: event_error } = await adminSupabase
      .from("events")
      .select("event_name")
      .eq("event_id", event_id)
      .single();

    if (event_error || !event_data) {
      let msg = "Error retrieving event information";
      if (event_error) {
        msg += ` due to (${event_error.code}) ${event_error.message}`;
      }
      throw Error(msg);
    }

    const stripe = new Stripe(stripeSecretKey);
    
    // Build redirect URL based on which ID was provided
    let redirect = "";
    if (student_event_id) {
      redirect = `${request.url.origin}/student/${host_id}/${event_id}`;
    } else if (team_id) {
      // For teams, we need to determine the right URL
      const { data: team_data, error: team_error } = await adminSupabase
        .from("teams")
        .select("org_id")
        .eq("team_id", team_id)
        .single();
        
      if (team_error) throw Error(`Error getting team info: ${team_error.message}`);
      
      redirect = `${request.url.origin}/coach/${team_data.org_id}/${host_id}/${event_id}`;
    } else if (org_event_id) {
      // For org events, we need to get the org_id
      const { data: org_event_data, error: org_event_error } = await adminSupabase
        .from("org_events")
        .select("org_id")
        .eq("org_event_id", org_event_id)
        .single();
        
      if (org_event_error) throw Error(`Error getting org event info: ${org_event_error.message}`);
      
      redirect = `${request.url.origin}/coach/${org_event_data.org_id}/${host_id}/${event_id}`;
    }

    // Create Stripe line items for each add-on
    const line_items = addons.map(addon => {
      const add_on = addon_data.find(a => a.addon_id === addon.addon_id);
      
      if (!add_on) {
        throw Error(`Add-on with ID ${addon.addon_id} not found or not enabled`);
      }
      
      return {
        price_data: {
          currency: "USD",
          unit_amount: add_on.price_cents,
          product_data: {
            name: `${add_on.addon_name} for ${event_data.event_name}`,
          },
        },
        quantity: addon.quantity,
      };
    });

    const success_url = `${
      request.url.origin
    }/api/purchase-addon?session_id={CHECKOUT_SESSION_ID}&redirect=${encodeURIComponent(
      redirect
    )}`;
    
    const cancel_url = redirect;
    
    const session = await stripe.checkout.sessions.create({
      line_items,
      allow_promotion_codes: true,
      metadata: {
        purchasing_user_id: user.id,
        event_id,
        student_event_id: student_event_id || "",
        team_id: team_id || "",
        org_event_id: org_event_id || "",
      },
      mode: "payment",
      success_url,
      cancel_url,
    });

    redirect_url = session.url;
  } catch (e: any) {
    return new Response("failed to execute: " + e.message, { status: 400 });
  }

  return new Response(redirect_url);
};

export const GET: RequestHandler = async (request: RequestEvent) => {
  let session_id;
  let redirect;
  try {
    session_id = request.url.searchParams.get("session_id");
    if (!session_id) throw Error("missing session id");

    const redirect_param = request.url.searchParams.get("redirect");
    if (!redirect_param) throw Error("missing redirect");
    redirect = decodeURIComponent(redirect_param);
  } catch (e: any) {
    return new Response(e.message, {
      status: 400,
    });
  }
  
  const stripe = new Stripe(stripeSecretKey);
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const line_items = await stripe.checkout.sessions.listLineItems(session_id);

  if (session.payment_status != "paid")
    return new Response("payment not completed", { status: 400 });

  // Extract metadata
  const student_event_id = session.metadata?.student_event_id || null;
  const team_id = session.metadata?.team_id || null;
  const org_event_id = session.metadata?.org_event_id || null;
  const event_id = session.metadata?.event_id;

  // Get add-on details from the line items
  const line_item_details = line_items.data.map(item => ({
    description: item.description,
    quantity: item.quantity
  }));

  // Get addon information to map from descriptions back to addon_ids
  const { data: addons, error: addon_error } = await adminSupabase
    .from("addons")
    .select("*")
    .eq("event_id", parseInt(event_id as string));

  if (addon_error) {
    return new Response(`failed to retrieve addons: ${addon_error.message}`, { status: 400 });
  }

  // Create addon_orders for each purchased addon
  for (const line_item of line_items.data) {
    // Find the addon that matches this line item
    // We need to extract the addon name from the description
    const descriptionParts = line_item.description?.split(' for ') || [];
    if (descriptionParts.length < 1) continue;
    
    const addonName = descriptionParts[0];
    const matchingAddon = addons.find(a => a.addon_name === addonName);
    
    if (!matchingAddon) continue;

    const addon_order = {
      addon_id: matchingAddon.addon_id,
      quantity: line_item.quantity || 0,
      order_id: session_id,
      student_event_id: student_event_id ? parseInt(student_event_id) : null,
      team_id: team_id ? parseInt(team_id) : null,
      org_event_id: org_event_id ? parseInt(org_event_id) : null
    };

    const { error: order_error } = await adminSupabase
      .from("addon_orders")
      .insert(addon_order);

    if (order_error) {
      return new Response(`failed to insert addon order: ${order_error.message}`, { status: 400 });
    }
  }

  return Response.redirect(redirect, 303);
}; 