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
  // Determine the column to filter by based on the custom_field_table
  const tableColumn =
    custom_field_table === "students"
      ? "student_event_id"
      : custom_field_table === "teams"
      ? "team_id"
      : "org_event_id";

  // Get the list of custom field IDs to fetch
  const customFieldIds = event_custom_fields.map((field: any) => field.custom_field_id);
  let customFieldValues;
  // Fetch all relevant custom field values in one query
  if (table_id) {
    const { data: customFieldValues, error } = await supabase
    .from("custom_field_values")
    .select("custom_field_id, value")
    .in("custom_field_id", customFieldIds)
    .eq(tableColumn, table_id);

    if (error) {
      throw error;
    }
  }
  
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

  return fieldsWithValues ?? [];
}

export async function upsertCustomFieldResponses(
  custom_field_dict: Record<number, any>, // Assuming keys are custom_field_ids and values are the corresponding values
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
    custom_field_id: custom_field_id,
    value: value,
  }));

  // Perform the upsert operation
  const { data, error } = await supabase
    .from("custom_field_values")
    .upsert(upsertData);

  if (error) {
    throw error;
  }

  return data;
}

export async function addStudentToEvent(student_id: string, event_id: number, team_id: number = null, org_id: number = null) {
  const { data, error } = await supabase
    .from("student_events")
    .insert({ student_id, event_id, team_id, org_id })
    .select()
    .single();
  if (error) throw error;
  console.log("addStudentToEvent", data);
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


