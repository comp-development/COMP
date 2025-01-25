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

export async function getStudentEvents(student_id: string) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, event:events(*)")
    .eq("student_id", student_id);
  if (error) throw error;
  return data;
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
