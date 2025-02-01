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
    .select("*, students(*)");

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

export async function changeTeam(team_name: string, event_id: number, org_id: number, team_id: number | null) {
  const teamData = { team_name, event_id, org_id };

  if (team_id !== null) {
    teamData.team_id = team_id;
  }

  const { data, error } = await supabase
    .from("teams")
    .upsert(teamData)
    .select();
  if (error) throw error;

  return data;
}

export async function getStudentsWithoutTeam(event_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, student:students(*)")
    .eq("event_id", event_id)
    .is("team_id", null);
  if (error) throw error;

  return data;
}

export async function deleteTeam(team) {
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("team_id", team.team_id);
  if (error) throw error;

  for (const student of team.teamMembers) {
    const { error } = await supabase
      .from("student_events")
      .update({ team_id: null })
      .eq("student_event_id", student.student_event_id);
    if (error) throw error;
  }
}