import { supabase } from "../supabaseClient";
export async function getOrganization(org_id: number) {
  const { data, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("org_id", org_id)
    .single();
  if (error) throw error;

  const { data: coachData, error: coachError } = await supabase
    .from("org_coaches")
    .select("*, person:coaches(*)")
    .eq("org_id", org_id);
  if (coachError) throw coachError;

  return { ...data, coaches: coachData };
}

export async function getOrganizationDetails(org_id: number, event_id: number) {
  const { data, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("org_id", org_id)
    .single();
  if (error) throw error;

  const { data: coachData, error: coachError } = await supabase
    .from("org_coaches")
    .select("*, person:coaches(*)")
    .eq("org_id", org_id);
  if (coachError) throw coachError;

  const orgData = data as any;
  
  orgData.coaches = coachData;

  const teams = await getOrganizationTeams(org_id, event_id);
  orgData.teams = teams;

  const events = await ifOrgEvent(event_id, org_id);
  orgData.event = events;

  return orgData;
}

export async function getCoachOrganization(
  coach_id: string,
  event_id: number,
  org_id: number,
) {
  const { data, error } = await supabase
    .from("org_coaches")
    .select("org_id, orgs(*)")
    .eq("org_id", org_id)
    .eq("coach_id", coach_id)
    .single();
  if (error) throw error;

  const teams = await getOrganizationTeams(org_id, event_id);
  data.teams = teams;
  const events = await ifOrgEvent(event_id, org_id);
  data.event = events;

  return data;
}

export async function getTicketCount(event_id: number, org_id: number) {
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("quantity")
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .not("refund_status","eq", "APPROVED")
    .not("refund_status", "eq", "REQUESTED");
  if (error) throw error;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  console.log("SUM", sum)
  return sum(data.map((to) => to.quantity));
}

export async function getEventRefundRequests(event_id: number) {
  try {
    console.log("Fetching refund requests for event:", event_id);

    const { data, error } = await supabase
      .from("ticket_orders")
      .select(`
        *,
        students(first_name, last_name),
        orgs(name)
      `)
      .eq("event_id", event_id)
      .not("refund_status", "eq", "NONE");



    if (error) {
      console.error("Error in getEventRefundRequests:", error);
      throw error;
    }

    console.log("Refund requests data: ", data);
    return data || [];
  } catch (error) {
    console.error("Error getting refund requests:", error);
    throw error;
  }
}

export async function getEventRefundedRequests(event_id: number) {
  try {
    console.log("Fetching refunded requests for event:", event_id);

    const { data, error } = await supabase
      .from("refunded_ticket_orders")
      .select(`
        *,
        students(first_name, last_name),
        orgs(name)
      `)
      .eq("event_id", event_id)
    if (error) {
      console.error("Error in getEventRefundRequests:", error);
      throw error;
    }

    const { data: approvedData, error: approvedError } = await supabase
      .from("ticket_orders")
      .select(`
        *,
        students(first_name, last_name),
        orgs(name)
      `)
      .eq("event_id", event_id)
      .eq("refund_status", "APPROVED"); // Only approved refunds

    if (approvedError) {
      console.error("Error in getEventRefundRequests (ticket_orders):", approvedError);
      throw approvedError;
    }

    const combinedData = [...data, ...approvedData];

    console.log("Refunded requests data: ", combinedData);
    return combinedData || [];

  } catch (error) {
    console.error("Error getting refund requests:", error);
    throw error;
  }
}

export async function getOrganizationActiveTickets(event_id: number, org_id: number) {
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .not("refund_status","eq", "APPROVED")
    .not("refund_status", "eq", "REQUESTED");
  if (error) throw error;
  return data;
  
}

export async function getOrganizationFinishedTickets(event_id: number, org_id: number) {
  // go to org
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("*")
    .eq("org_id", org_id)
    .eq("event_id", event_id)
    .or("refund_status.eq.APPROVED,refund_status.eq.REQUESTED");
  if (error) throw error;
  return data;
  
}

// still needs to be made, don't call for now
export async function getUsedTicketCount(event_id: number, org_id: number) {
  // unimplemented();
  throw new Error()
  // error('This function has not been implemented yet.');
  const { data, error } = await supabase
    .from("ticket_orders")
    .select("quantity")
    .eq("org_id", org_id)
    .eq("event_id", event_id);
  if (error) throw error;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  return sum(data.map((to) => to.quantity));
}

export async function getCoachOrganizations(coach_id: string) {
  const { data, error } = await supabase
    .from("org_coaches")
    .select("org_id, orgs(*)")
    .eq("coach_id", coach_id);
  if (error) throw error;

  return data;
}

export async function addCoachToOrganization(coach_id: string, org_id: number) {
  const { data, error } = await supabase
    .from("org_coaches")
    .insert([{ coach_id, org_id }])
    .select("*, person:coaches(*)")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function removeCoachFromOrganization(
  coach_id: string,
  org_id: number,
) {
  const { error } = await supabase
    .from("org_coaches")
    .delete()
    .match({ coach_id, org_id });

  if (error) throw error;
}

export async function getOrganizationTeams(org_id: number, event_id: number) {
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("org_id", org_id)
    .eq("event_id", event_id);
  if (teamError) throw teamError;

  for (let i = 0; i < teamData.length; i++) {
    const { data, error } = await supabase
      .from("student_events")
      .select("*, person:students(*)")
      .eq("team_id", teamData[i].team_id)
      .order("front_id", { ascending: true });
    if (error) throw error;

    teamData[i]["teamMembers"] = data;
  }

  return teamData;
}

export async function ifOrgEvent(event_id: number, org_id: number) {
  const { data, error } = await supabase
    .from("org_events")
    .select("*")
    .eq("event_id", event_id)
    .eq("org_id", org_id)
    .maybeSingle();
  if (error) throw error;

  return data;
}

export async function getOrgEventByJoinCode(
  event_id: number,
  join_code: string,
) {
  const { data, error } = await supabase
    .from("org_events")
    .select("*, org:orgs(*)")
    .eq("event_id", event_id)
    .eq("join_code", join_code)
    .single();
  if (error) throw error;

  return data;
}

export async function upsertOrgEvent(event_id: number, org_id: number) {
  const upsertData: any = { event_id, org_id };

  const { data, error } = await supabase
    .from("org_events")
    .upsert(upsertData, {
      onConflict: "event_id,org_id",
    })
    .select("*")
    .single();
  if (error) throw error;

  return data;
}

export async function updateStudentOrgEvent(
  student_event_id: number,
  new_org_id: number,
) {
  const { data, error } = await supabase
    .from("student_events")
    .update({
      org_id: new_org_id,
    })
    .eq("student_event_id", student_event_id)
    .select("*, students(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function editOrganization(org: {}, org_id: number) {
  const { data, error } = await supabase
    .from("orgs")
    .update({
      name: org.name,
      address: org.address,
    })
    .eq("org_id", org_id)
    .select()
    .single();
  if (error) throw error;
  console.log(data);
  return data;
}

export async function addOrganization(org: {}, coachId: string) {
  const { data: orgData, error: orgError } = await supabase
    .from("orgs")
    .insert({
      name: org.name,
      address: org.address,
    })
    .select()
    .single();
  if (orgError) throw orgError;

  const { data: orgCoachData, error: orgCoachError } = await supabase
    .from("org_coaches")
    .insert({
      org_id: orgData.org_id,
      coach_id: coachId,
    })
    .select()
    .single();
  if (orgCoachError) throw orgCoachError;

  return { org: orgData, orgCoach: orgCoachData };
}

export async function removeStudentFromOrganization(student_event_id: number) {
  const { error } = await supabase
    .from("student_events")
    .update({
      org_id: null,
      team_id: null,
    })
    .eq("student_event_id", student_event_id);
  if (error) throw error;
}
