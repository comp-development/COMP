import { supabase } from "$lib/supabaseClient";

export * from "./users";
export * from "./tests";
export * from "./events";
export * from "./teams";
export * from "./problems";
export * from "./guts";
export * from "./scores";
export * from "./hosts";
export * from "./orgs";
export * from "./transfers";

export function getUserTypeDatabase(type: "student" | "coach" | "admin") {
  return type === "coach" ? "coaches" : type + "s";
}

/**
 * Get all enabled add-ons for an event
 *
 * @param event_id number
 * @param entity_type 'students' | 'teams' | 'orgs' - which entity type to get add-ons for
 * @returns list of enabled add-ons for the event and entity type
 */
export async function getEventAddons(
  event_id: number, 
  entity_type: 'students' | 'teams' | 'orgs'
) {
  const { data, error } = await supabase
    .from("addons")
    .select("*")
    .eq("event_id", event_id)
    .eq("enabled", true)
    .eq("addon_table", entity_type);

  if (error) throw error;
  return data;
}

/**
 * Get add-ons purchased by a student, team or organization for an event
 *
 * @param options Object containing one of: student_event_id, team_id, or org_event_id
 * @returns list of purchased add-ons with quantities
 */
export async function getPurchasedAddons(options: {
  student_event_id?: number;
  team_id?: number;
  org_event_id?: number;
}) {
  // Ensure exactly one ID is provided
  const count = 
    (options.student_event_id ? 1 : 0) + 
    (options.team_id ? 1 : 0) + 
    (options.org_event_id ? 1 : 0);
  
  if (count !== 1) {
    throw new Error("Exactly one of student_event_id, team_id, or org_event_id must be provided");
  }
  
  let query = supabase
    .from("addon_orders")
    .select(`
      addon_id,
      quantity,
      addons!addon_orders_addon_id_fk (
        addon_id,
        addon_name,
        price_cents,
        enabled,
        description
      )
    `);
  
  if (options.student_event_id) {
    query = query.eq("student_event_id", options.student_event_id);
  } else if (options.team_id) {
    query = query.eq("team_id", options.team_id);
  } else if (options.org_event_id) {
    query = query.eq("org_event_id", options.org_event_id);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
