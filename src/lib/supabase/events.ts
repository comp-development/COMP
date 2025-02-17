import type { QueryData } from "@supabase/supabase-js";
import { supabase, type AsyncReturnType } from "../supabaseClient";

export async function getAllEvents(select: string = "*") {
  const { data, error } = await supabase.from("events").select(select);
  if (error) throw error;
  return data;
}

export async function getHostEvents(
  host_id: string,
  customSelect: string = "*",
) {
  const { data, error } = await supabase
    .from("events")
    .select(customSelect)
    .eq("host_id", host_id);
  if (error) throw error;
  return data;
}

export async function getEventInformation(event_id: number) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("event_id", event_id)
    .single();
  if (error) throw error;
  return data;
}

export async function getEventTests(event_id: number) {
  let { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("event_id", event_id)
    .order("test_name");
  if (error) throw error;
  return data;
}

export async function getEventTeams(event_id: number) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("event_id", event_id);
  if (error) throw error;
  return data;
}

export async function getEventCustomFields(event_id:number, custom_field_table: "orgs" | "students" | "teams" = "students") {
  const { data, error } = await supabase
    .from("custom_fields")
    .select("*")
    .eq("event_id", event_id)
    .eq("custom_field_table", custom_field_table);
  if (error) throw error;
  return data;
}

export async function getCustomFieldResponses(
  event_custom_fields: any,
  table_id: number,
  custom_field_table: "orgs" | "students" | "teams" = "students"
) {
  console.log("getCustomFieldResponses", event_custom_fields, table_id, custom_field_table);
  // Determine the column to filter by based on the custom_field_table
  const tableColumn =
    custom_field_table === "students"
      ? "student_event_id"
      : custom_field_table === "teams"
      ? "team_id"
      : "org_event_id";

  // Get the list of custom field IDs to fetch
  const customFieldIds = event_custom_fields.map((field: any) => field.custom_field_id);
  
  // Declare customFieldValues outside the if block
  let customFieldValues = [];
  
  // Fetch all relevant custom field values in one query
  if (table_id) {
    console.log("table_id", table_id)
    const { data, error } = await supabase
      .from("custom_field_values")
      .select("custom_field_id, value")
      .in("custom_field_id", customFieldIds)
      .eq(tableColumn, table_id);

    if (error) {
      throw error;
    }
    customFieldValues = data;
  }
  
  console.log("customFieldValues", customFieldValues);
  // Create a mapping of custom_field_id to value for quick lookup
  const valueMap = (customFieldValues || []).reduce(
    (map, row) => ({
      ...map,
      [row.custom_field_id]: row.value,
    }),
    {}
  );

  // Map the input fields with their corresponding values
  const fieldsWithValues = event_custom_fields.map((field: any) => ({
    ...field,
    value: valueMap[field.custom_field_id] || null,
  }));


  console.log("fieldsWithValues", fieldsWithValues);

  return fieldsWithValues ?? [];
}

export async function upsertCustomFieldResponses(
  custom_field_dict: Record<number, any>,
  table_id: number,
  custom_field_table: "orgs" | "students" | "teams" = "students"
) {
  // Determine the column to filter by based on the custom_field_table
  const tableColumn =
    custom_field_table === "students"
      ? "student_event_id"
      : custom_field_table === "teams"
      ? "team_id"
      : "org_event_id";

  // Prepare the data for upsert
  const upsertData = Object.entries(custom_field_dict).map(([custom_field_id, value]) => ({
    [tableColumn]: table_id,
    custom_field_id: parseInt(custom_field_id),
    value: value,
  }));

  // Perform the upsert operation
  const { data, error } = await supabase
    .from("custom_field_values")
    .upsert(upsertData, {
      onConflict: ["custom_field_id", "org_event_id", "student_event_id", "team_id"],
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 
 * @param student_id 
 * @param event_id 
 * @param options 
 * @returns 
 * 
 * This function is used to upsert student events
 * this is useful for initially creating student_events, 
 * as well as modifying the teams/orgs of existing student_events
 */

export async function upsertStudentEvent(
  student_id: string,
  event_id: number,
  options?: {
    team_id?: number | null;
    org_id?: number | null;
  }
) {
  const upsertData: any = { student_id, event_id };
  if (options?.team_id !== undefined) upsertData.team_id = options.team_id;
  if (options?.org_id !== undefined) upsertData.org_id = options.org_id;

  const { data, error } = await supabase
    .from("student_events")
    .upsert(upsertData, { 
      onConflict: 'student_id,event_id'  // Specify the unique constraint
    })
    .select("*, teams(*, student_events(*, students(*))), org_events(*)")
    .single();
  if (error) throw error;
  console.log("upsertStudentEvent", data);
  return data;
}
	

export async function getStudentTeams(student_id: string) {
  const { data, error } = await supabase
    .from("student_teams")
    .select("*, teams!inner(*, events!inner(*))")
    .eq("student_id", student_id);
  if (error) throw error;
  return data;
}

export async function getStudentEvents(student_id: string) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, event:events(*)")
    .eq("student_id", student_id);
  if (error) throw error;
  return data;
}

export async function getStudentHostEvents(student_id: string, host_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, event:events!inner(*)")
    .eq("student_id", student_id)
    .eq("event.host_id", host_id)
  if (error) throw error;
  return data;
}

export async function getCoachHostEvents(coach_id: string, host_id: number) {
  const { data: orgCoachData, error: orgCoachError } = await supabase
    .from("org_coaches")
    .select("org_id")
    .eq("coach_id", coach_id);
  if (orgCoachError) throw orgCoachError;

  const orgIds = orgCoachData?.map((org) => org.org_id) || [];
  if (orgIds.length === 0) return [];

  const { data: orgEventsData, error: orgEventsError } = await supabase
    .from("org_events")
    .select("event:events!inner(*)")
    .in("org_id", orgIds)
    .eq("event.host_id", host_id);
  if (orgEventsError) throw orgEventsError;

  return orgEventsData;
}

export type StudentEvent = AsyncReturnType<typeof getStudentEvent>;

export async function getStudentEvent(student_id: string, event_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, teams(*, student_events(*, students(*))), org_events(*)")
    .eq("student_id", student_id)
    .eq("event_id", event_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getStudentTicketOrder(
  student_id: string,
  event_id: number,
) {
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("student_id", student_id)
    .eq("event_id", event_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}


export async function getEventsbyStudentID(student_id: string, customSelect: string = "*") {
	const { data, error } = await supabase
		.from('student_events_detailed')
		.select(customSelect)
		.eq('student_id', student_id);
	if (error) throw error;
	return data;
}

// export async function getStudentEvents(event_id: string, select = "*, students(*)") {
	
// 	const parsedEventId = parseInt(event_id, 10); // Parse event_id to integer
	
// 	if (isNaN(parsedEventId)) {
// 	  throw new Error("Invalid event_id: Must be a valid integer");
// 	}
  
// 	const { data, error } = await supabase
// 	  .from("student_events_detailed")
// 	  .select(select)
// 	  .eq("event_id", parsedEventId); // Use parsed integer
// 	if (error) {
// 		console.error(error);
// 	}
// 	return data
// }

export async function getCustomFields(event_id: string, select = "*") {
	
	const parsedEventId = parseInt(event_id, 10); // Parse event_id to integer
	
	if (isNaN(parsedEventId)) {
	  throw new Error("Invalid event_id: Must be a valid integer");
	}
  
	const { data, error } = await supabase
	  .from("custom_fields")
	  .select(select)
	  .eq("event_id", parsedEventId); 

	if (error) {
		console.error(error);
		
	}
	return data
}
