import { supabase } from "../supabaseClient";

export async function getTeam(team_id: string) {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("team_id", team_id)
    .single();

  if (teamError) throw teamError;

  const { data, error } = await supabase
    .from("student_events")
    .select("*, students(*)")
    .eq("team_id", team_id)
    .order("front_id", { ascending: true });

  if (error) throw error;
  return {
    teamMembers: data,
    ...teamData,
  };
}

export async function getTeamByJoinCode(event_id: number, join_code: string) {
  const { data, error } = await supabase
      .from("teams")
      .select("*, student_event:student_events(*, student:students(*))")
      .eq("event_id", event_id)
      .eq("join_code", join_code)
      .single();
  if (error) throw error;

  return data;
}

export async function getTeamId(student_id: string, event_id: number) {
  try {
    // First, get the team_id for the given student_id
    const { data, error: studentTeamError } = await supabase
      .from("student_teams")
      .select("team_id, teams!inner(*)")
      .eq("teams.event_id", event_id)
      .eq("student_id", student_id)
      .single();

    if (studentTeamError) throw studentTeamError;

    return data?.team_id;
  } catch (error) {
    console.error("Error retrieving team ID:", error);
    throw error;
  }
}

export async function updateStudentTeam(
  student_event_id: number,
  new_team_id: number,
  new_org_id: number
) {
  const { data, error } = await supabase
    .from("student_events")
    .update({
      team_id: new_team_id,
      org_id: new_org_id
    })
    .eq("student_event_id", student_event_id)
    .select("*, person:students(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudentTeam(student_event_id: number) {
  const { error } = await supabase
    .from("student_events")
    .update({ team_id: null })
    .eq("student_event_id", student_event_id);
  if (error) throw error;
}

export async function upsertTeam(event_id: number, teamData?: {
    team_name?: string | null;
    team_id?: number | null;
    org_id?: number | null;
  }) {
  const upsertData: any = {event_id};
  if (teamData?.team_id !== undefined) upsertData.team_id = teamData.team_id;
  if (teamData?.org_id !== undefined) upsertData.org_id = teamData.org_id;
  if (teamData?.team_name !== undefined) upsertData.team_name = teamData.team_name;
  
  console.log("upsertData", upsertData);
  const { data, error } = await supabase
    .from("teams")
    .upsert(upsertData, {
      onConflict: "team_id"
    })
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function getStudentsWithoutTeam(event_id: number, org_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, person:students(*)")
    .eq("event_id", event_id)
    .eq("org_id", org_id)
    .is("team_id", null);
  if (error) throw error;

  return data;
}

export async function deleteTeam(team_id: number) {
  // Delete the team record
  const { error: deleteError } = await supabase
    .from("teams")
    .delete()
    .eq("team_id", team_id);
  if (deleteError) throw deleteError;

  // Update all team members in a single query
  const { error: updateError } = await supabase
    .from("student_events")
    .update({ team_id: null })
    .eq("team_id", team_id);
  if (updateError) throw updateError;
}