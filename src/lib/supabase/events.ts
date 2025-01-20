import { supabase } from "../supabaseClient";

export async function getAllEvents(select: string = "*") {
  const { data, error } = await supabase.from("events").select(select);
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

export async function getStudentTeams(student_id: string) {
  const { data, error } = await supabase
    .from("student_teams")
    .select("*, teams!inner(*, events!inner(*))")
    .eq("student_id", student_id);
  if (error) throw error;
  return data;
}

export async function getStudentEvent(student_id: string, event_id: number) {
  const { data, error } = await supabase
    .from("student_events_detailed")
    .select("*, teams!inner(*, student_events_detailed!inner(*))")
    .eq("student_id", student_id)
    .eq("teams.event_id", event_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getStudentOrgEvent(student_id: string, event_id: number) {
  const { data, error } = await supabase
    .from("student_org_events")
    .select("*, org_events!inner(*)")
    .eq("student_id", student_id)
    .eq("org_events.event_id", event_id)
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
