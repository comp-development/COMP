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
export * from "./uploadScan";

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
    .eq("visible", true)
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
        key,
        label,
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

/**
 * Get addon quantities for all entities in an event
 * 
 * @param event_id number
 * @returns Object containing addon quantities for students, teams, and orgs
 */
export async function getEventAddonQuantities(event_id: number) {
  // Get all addons for the event first
  const { data: addons, error: addonError } = await supabase
    .from("addons")
    .select("*")
    .eq("event_id", event_id)

  if (addonError) throw addonError;
  console.log('Found addons:', addons);

  // Get all addon orders for the event
  const { data: orders, error: orderError } = await supabase
    .from("addon_orders")
    .select(`
      addon_id,
      quantity,
      student_event_id,
      team_id,
      org_event_id
    `)
    .in("addon_id", addons.map(a => a.addon_id));

  if (orderError) throw orderError;
  console.log('Found orders:', orders);

  // Create maps to store quantities by entity ID
  const studentQuantities = new Map<number, Map<string, number>>();
  const teamQuantities = new Map<number, Map<string, number>>();
  const orgQuantities = new Map<number, Map<string, number>>();

  // Process orders into the maps
  orders.forEach(order => {
    if (order.student_event_id) {
      if (!studentQuantities.has(order.student_event_id)) {
        studentQuantities.set(order.student_event_id, new Map());
      }
      const studentMap = studentQuantities.get(order.student_event_id)!;
      studentMap.set(order.addon_id, (studentMap.get(order.addon_id) || 0) + order.quantity);
    } else if (order.team_id) {
      if (!teamQuantities.has(order.team_id)) {
        teamQuantities.set(order.team_id, new Map());
      }
      const teamMap = teamQuantities.get(order.team_id)!;
      teamMap.set(order.addon_id, (teamMap.get(order.addon_id) || 0) + order.quantity);
    } else if (order.org_event_id) {
      if (!orgQuantities.has(order.org_event_id)) {
        orgQuantities.set(order.org_event_id, new Map());
      }
      const orgMap = orgQuantities.get(order.org_event_id)!;
      orgMap.set(order.addon_id, (orgMap.get(order.addon_id) || 0) + order.quantity);
    }
  });

  return {
    addons,
    studentQuantities,
    teamQuantities,
    orgQuantities
  };
}

// Export from deletion.ts
export { 
  deleteStudentFromEvent,
  deleteTeamFromEvent,
  deleteOrganizationFromEvent
} from './deletion';
