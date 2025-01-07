import type { Tables } from "../../../db/database.types";
import { supabase } from "../supabaseClient";
import type { Merge } from "type-fest";

export async function getTeam(team_id: string) {
  try {
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("team_id", team_id)
      .single();

    if (teamError) throw teamError;

    const { data, error } = await supabase
      .from("student_events_detailed")
      .select("*, students(*)")
      .eq("team_id", team_id)
      .order("front_id", { ascending: true });

    if (error) throw error;
    return {
      teamMembers: data,
      ...teamData,
    };
  } catch (error) {
    console.error("Error retrieving team:", error);
    throw error;
  }
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
