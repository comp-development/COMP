import { supabase } from "../supabaseClient";

/**
 * Transfers a student to a new team (and its organization if applicable)
 * 
 * Requirements:
 * 1. If the team belongs to an organization, the student will also be transferred to that organization
 * 2. If the team doesn't belong to an organization, the student's org_id will be set to null
 * 
 * @param student_event_id The ID of the student_event to transfer
 * @param new_team_id The ID of the team to transfer the student to
 * @returns The updated student_event record
 */
export async function transferStudentToTeam(student_event_id: number, new_team_id: number) {
  // First, get the organization ID of the team (if any)
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("org_id")
    .eq("team_id", new_team_id)
    .single();

  if (teamError) throw teamError;
  
  // Now update the student record with both the new team_id and org_id
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
 * 
 * Requirements:
 * 1. The student's team_id will be set to null
 * 2. The student's org_id will be set to the new organization
 * 
 * @param student_event_id The ID of the student_event to transfer
 * @param new_org_id The ID of the organization to transfer the student to
 * @returns The updated student_event record
 */
export async function transferStudentToOrg(student_event_id: number, new_org_id: number) {
  // Update the student's organization and set team to null
  const { data, error } = await supabase
    .from("student_events")
    .update({
      org_id: new_org_id,
      team_id: null
    })
    .eq("student_event_id", student_event_id)
    .select("*, person:students(*)")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Transfers a team to a new organization and updates all associated students
 * 
 * Requirements:
 * 1. The team's org_id will be updated
 * 2. All students in the team will be transferred to the new organization
 * 
 * @param team_id The ID of the team to transfer
 * @param new_org_id The ID of the organization to transfer the team to (or null to remove org affiliation)
 * @returns An object containing the updated team and list of affected students
 */
export async function transferTeamToOrg(team_id: number, new_org_id: number | null) {
  try {
    // 1. Update the team's organization
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .update({ org_id: new_org_id })
      .eq("team_id", team_id)
      .select()
      .single();
    
    if (teamError) throw teamError;
    
    // 2. Get all students in this team
    const { data: studentsData, error: studentsError } = await supabase
      .from("student_events")
      .select("student_event_id")
      .eq("team_id", team_id);
    
    if (studentsError) throw studentsError;
    
    // 3. If there are students in the team, update all of their org_id values
    let updatedStudents: any[] = [];
    if (studentsData && studentsData.length > 0) {
      const studentIds = studentsData.map(s => s.student_event_id);
      
      const { data: updatedStudentData, error: updateError } = await supabase
        .from("student_events")
        .update({ org_id: new_org_id })
        .in("student_event_id", studentIds)
        .select("*, person:students(*)");
      
      if (updateError) {
        // If updating students fails, revert the team update to maintain consistency
        await supabase
          .from("teams")
          .update({ org_id: teamData.org_id }) // Revert to original org_id
          .eq("team_id", team_id);
          
        throw updateError;
      }
      
      updatedStudents = updatedStudentData;
    }
    
    return {
      team: teamData,
      students: updatedStudents
    };
  } catch (error) {
    console.error("Error transferring team to organization:", error);
    throw error;
  }
}
