import toast from "$lib/toast.svelte";
import { supabase } from "../supabaseClient";

export async function getTeam(team_id: number) {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("team_id", team_id)
    .single();

  if (teamError) throw teamError;

  const { data, error } = await supabase
    .from("student_events")
    .select("*, person:students(*)")
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
      .from("student_events")
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
  new_org_id: number | null,
) {
  const { data, error } = await supabase
    .from("student_events")
    .update({
      team_id: new_team_id,
      org_id: new_org_id,
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

export async function inviteUserToTeam(team_id: number, emails: string[], teamSize: number, maxSize: number) {
  const { data, error } = await supabase
    .from("teams")
    .select("invites")
    .eq("team_id", team_id)
    .single();

  if (error) throw error;

  let invites: string[] = data.invites || [];
  let newInvites: string[] = [];
  let allValid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check for invalid emails
  emails.forEach((email) => {
    const trimmed = email.trim();
    if (emailRegex.test(trimmed)) {
      if (!invites.includes(trimmed)) {
        invites.push(trimmed);
        newInvites.push(trimmed);
      }
    } else {
      allValid = false;
    }
  });

  if (!allValid) {
    toast.error("One or more of the emails are invalid and were not added");
  }

  // Fetch student data and check if they are already in a team or org
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("student_id, email")
    .in("email", invites);

  if (studentsError) throw studentsError;

  const studentIds = students.map(student => student.student_id);

  const { data: studentEvents, error: studentEventsError } = await supabase
    .from("student_events")
    .select("student_id, team_id, org_id")
    .in("student_id", studentIds);

  if (studentEventsError) throw studentEventsError;

  const duplicateEmails = studentEvents
    .filter(event => event.team_id || event.org_id)
    .map(event => students.find(student => student.student_id === event.student_id)?.email);

  if (duplicateEmails.length > 0) {
    toast.error("Some students are already in a team or organization");
    newInvites = newInvites.filter(email => !duplicateEmails.includes(email));
    invites = invites.filter(email => !duplicateEmails.includes(email));
  }

  // Check if the team max size is met
  if (teamSize + invites.length > maxSize) {
    toast.error(`You can only have ${maxSize} members on a team`);
    invites = invites.slice(0, maxSize - teamSize);
    newInvites = newInvites.slice(0, maxSize - teamSize);
  }

  const { error: updateError } = await supabase
    .from("teams")
    .update({ invites })
    .eq("team_id", team_id);

  if (updateError) throw updateError;

  return { newInvites, invites };
}

export async function removeUserInvitationFromTeam(team_id: number, email: string) {
  const { data, error: fetchError } = await supabase
    .from("teams")
    .select("invites")
    .eq("team_id", team_id)
    .single();

  if (fetchError) throw fetchError;

  let invites = data.invites as string[] | null;

  if (invites) {
    invites = invites.filter((invite: string) => invite !== email);
  }

  const { error: updateError } = await supabase
    .from("teams")
    .update({ invites })
    .eq("team_id", team_id);

  if (updateError) throw updateError;
}

export async function checkUserInvitedToTeam(team_id: number, email: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("invites")
    .eq("team_id", team_id)
    .single();
  if (error) throw error;
  
  return (data.invites as string[] | null)?.includes(email);
}

export async function upsertTeam(
  event_id: number,
  teamData?: {
    team_name?: string | null;
    team_id?: number | null;
    org_id?: number | null;
  },
) {
  const upsertData: any = { event_id };
  if (teamData?.team_id !== undefined) upsertData.team_id = teamData.team_id;
  if (teamData?.org_id !== undefined) upsertData.org_id = teamData.org_id;
  if (teamData?.team_name !== undefined)
    upsertData.team_name = teamData.team_name;
  console.log("upsertData", upsertData);
  const { data, error } = await supabase
    .from("teams")
    .upsert(upsertData, {
      onConflict: "team_id",
    })
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function getAllStudentsWithoutTeam(event_id: number) {
  const { data, error } = await supabase
    .from("student_events")
    .select("*, person:students(*)")
    .eq("event_id", event_id)
    .is("team_id", null);
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

export async function getTeamCustomFieldValue(
  teamId: number,
  eventCustomFieldId: number,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("custom_field_values")
      .select("value")
      .eq("team_id", teamId)
      .eq("event_custom_field_id", eventCustomFieldId)
      .single();

    if (error) {
      // Handle cases where no row is found, which might not be an error
      if (error.code === 'PGRST116') {
        console.log(`No custom field value found for team ${teamId} and field ${eventCustomFieldId}`);
        return null;
      }
      throw error;
    }

    return data?.value ?? null;
  } catch (error) {
    // Assuming handleError exists and is imported, or handle appropriately
    // handleError(error as Error, `Failed to get custom field value for team ${teamId}, field ${eventCustomFieldId}`);
    console.error(`Failed to get custom field value for team ${teamId}, field ${eventCustomFieldId}`, error);
    return null; // Or rethrow, depending on desired error handling
  }
}
