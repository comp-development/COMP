import { supabase } from "../supabaseClient";

/**
 * Transfers a student to a new team (and its organization if applicable)
 * Special cases:
 * - If new_team_id is -1, removes team affiliation but keeps org affiliation
 * - If new_team_id is a valid team ID, updates both team and org based on the team's org
 * 
 * @param student_event_id The ID of the student_event to transfer
 * @param new_team_id The ID of the team to transfer the student to, or -1 to remove team affiliation
 * @returns The updated student_event record
 */
export async function transferStudentToTeam(student_event_id: number, new_team_id: number) {
  // Handle special case: removing team affiliation
  if (new_team_id === -1) {
    const { data, error } = await supabase
      .from("student_events")
      .update({
        team_id: null
        // Keep existing org_id
      })
      .eq("student_event_id", student_event_id)
      .select("*, person:students(*)")
      .single();

    if (error) throw error;
    return data;
  }

  // Regular case: transferring to a specific team
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("org_id")
    .eq("team_id", new_team_id)
    .single();

  if (teamError) throw teamError;

  // Update the student record with both the new team_id and org_id
  const { data, error } = await supabase
    .from("student_events")
    .update({
      team_id: new_team_id,
      org_id: teamData.org_id
    })
    .eq("student_event_id", student_event_id)
    .select("*, person:students(*)")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Transfers a student to a new organization and removes them from any team
 * Special cases:
 * - If new_org_id is -1, removes both team and org affiliations
 * - If new_org_id is a valid org ID, removes team affiliation and sets new org
 * 
 * @param student_event_id The ID of the student_event to transfer
 * @param new_org_id The ID of the organization to transfer the student to, or -1 to remove org affiliation
 * @returns The updated student_event record
 */
export async function transferStudentToOrg(student_event_id: number, new_org_id: number) {
  // Update the student's organization and always set team to null
  const { data, error } = await supabase
    .from("student_events")
    .update({
      org_id: new_org_id === -1 ? null : new_org_id,
      team_id: null // Always remove team affiliation when transferring orgs
    })
    .eq("student_event_id", student_event_id)
    .select("*, person:students(*)")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Transfers a team to a new organization and updates all associated students
 * Special cases:
 * - If new_org_id is -1, removes org affiliation from team and all its students
 * - If new_org_id is a valid org ID, updates team and all students to new org
 * 
 * This operation is executed as a single transaction, so it either completes entirely
 * or rolls back completely if any errors occur. Error handling is managed by PostgreSQL.
 * 
 * @param team_id The ID of the team to transfer
 * @param new_org_id The ID of the organization to transfer the team to, or -1 to remove org affiliation
 * @returns An object containing the updated team and list of affected students
 */
export async function transferTeamToOrg(team_id: number, new_org_id: number) {
  try {
    // Call the RPC function that handles the entire transfer as a transaction
    const { data, error } = await supabase.rpc(
      'transfer_team_to_organization', 
      { 
        p_team_id: team_id,
        p_new_org_id: new_org_id === -1 ? null : new_org_id // Convert -1 to null for the database
      }
    );
    
    // If there's an error from the database, throw it immediately
    if (error) throw error;
    
    // Return the successful result
    return {
      team: data.team,
      students: data.students || []
    };
  } catch (error) {
    console.error("Error transferring team to organization:", error);
    throw error;
  }
}
