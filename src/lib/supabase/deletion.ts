import { supabase } from "../supabaseClient";

/**
 * Delete a student from an event
 * @param student_event_id The ID of the student_event entry to delete
 */
export async function deleteStudentFromEvent(student_event_id: number) {
  // First, delete all custom field values for this student
  const { error: customFieldError } = await supabase
    .from("custom_field_values")
    .delete()
    .eq("student_event_id", student_event_id);

  if (customFieldError) throw customFieldError;

  // Then delete the student_event entry
  const { error } = await supabase
    .from("student_events")
    .delete()
    .eq("student_event_id", student_event_id);

  if (error) throw error;

  return { success: true };
}

/**
 * Delete a team from an event
 * @param team_id The ID of the team to delete
 * @param deleteStudents If true, deletes all students in the team; otherwise, just removes them from the team
 */
export async function deleteTeamFromEvent(team_id: number, deleteStudents: boolean = false) {
  // First, find all students in this team
  const { data: students, error: studentsError } = await supabase
    .from("student_events")
    .select("student_event_id, student_id")
    .eq("team_id", team_id);

  if (studentsError) throw studentsError;

  // Handle students based on deleteStudents flag
  if (students.length > 0) {
    if (deleteStudents) {
      // Delete all students in the team
      for (const student of students) {
        // Delete custom field values for each student
        const { error: customFieldError } = await supabase
          .from("custom_field_values")
          .delete()
          .eq("student_event_id", student.student_event_id);

        if (customFieldError) throw customFieldError;

        // Delete the student_event entry
        const { error: deleteError } = await supabase
          .from("student_events")
          .delete()
          .eq("student_event_id", student.student_event_id);

        if (deleteError) throw deleteError;
      }
    } else {
      // Just remove team_id from all students in the team
      const { error: updateError } = await supabase
        .from("student_events")
        .update({ team_id: null })
        .eq("team_id", team_id);

      if (updateError) throw updateError;
    }
  }

  // Delete all custom field values for this team
  const { error: customFieldError } = await supabase
    .from("custom_field_values")
    .delete()
    .eq("team_id", team_id);

  if (customFieldError) throw customFieldError;

  // Delete the team
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("team_id", team_id);

  if (error) throw error;

  return { 
    success: true, 
    affectedStudents: students.length,
    deletedStudents: deleteStudents ? students.length : 0
  };
}

/**
 * Delete an organization from an event
 * @param org_id The ID of the organization
 * @param event_id The ID of the event
 * @param deleteTeams If true, deletes all teams in the org; otherwise, just removes them from the org
 * @param deleteStudents If true, deletes all students in the org; otherwise, just removes them from the org
 */
export async function deleteOrganizationFromEvent(
  org_id: number, 
  event_id: number, 
  deleteTeams: boolean = false,
  deleteStudents: boolean = false
) {
  // First, find the org_event_id
  const { data: orgEvent, error: orgEventError } = await supabase
    .from("org_events")
    .select("org_event_id")
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .single();

  if (orgEventError) throw orgEventError;

  const org_event_id = orgEvent.org_event_id;

  // Find all teams in this org
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("team_id")
    .eq("org_id", org_id)
    .eq("event_id", event_id);

  if (teamsError) throw teamsError;

  // Handle teams based on deleteTeams flag
  let deletedTeams = 0;
  if (teams.length > 0) {
    if (deleteTeams) {
      // Delete all teams in the org
      for (const team of teams) {
        // Use the existing function to delete teams, passing the deleteStudents flag
        await deleteTeamFromEvent(team.team_id, deleteStudents);
        deletedTeams++;
      }
    } else {
      // Just remove org_id from all teams
      const { error: updateTeamsError } = await supabase
        .from("teams")
        .update({ org_id: null })
        .eq("org_id", org_id)
        .eq("event_id", event_id);

      if (updateTeamsError) throw updateTeamsError;
    }
  }

  // Find all students directly in this org (not via teams)
  const { data: students, error: studentsError } = await supabase
    .from("student_events")
    .select("student_event_id")
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .is("team_id", null); // Only students not in teams

  if (studentsError) throw studentsError;

  // Handle students based on deleteStudents flag
  let deletedStudents = 0;
  if (students.length > 0) {
    if (deleteStudents) {
      // Delete all students directly in the org
      for (const student of students) {
        // Delete custom field values for each student
        const { error: customFieldError } = await supabase
          .from("custom_field_values")
          .delete()
          .eq("student_event_id", student.student_event_id);

        if (customFieldError) throw customFieldError;

        // Delete the student_event entry
        const { error: deleteError } = await supabase
          .from("student_events")
          .delete()
          .eq("student_event_id", student.student_event_id);

        if (deleteError) throw deleteError;
        
        deletedStudents++;
      }
    } else {
      // Just remove org_id from all students
      const { error: updateStudentsError } = await supabase
        .from("student_events")
        .update({ org_id: null })
        .eq("org_id", org_id)
        .eq("event_id", event_id);

      if (updateStudentsError) throw updateStudentsError;
    }
  }

  // Delete all custom field values for this org
  const { error: customFieldError } = await supabase
    .from("custom_field_values")
    .delete()
    .eq("org_event_id", org_event_id);

  if (customFieldError) throw customFieldError;

  // Delete the org_event entry
  const { error } = await supabase
    .from("org_events")
    .delete()
    .eq("org_event_id", org_event_id);

  if (error) throw error;

  return { 
    success: true, 
    affectedTeams: teams.length,
    affectedStudents: students.length,
    deletedTeams,
    deletedStudents
  };
} 