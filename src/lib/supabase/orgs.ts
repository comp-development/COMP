import { supabase, type AsyncReturnType } from "../supabaseClient";

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

export type CoachEventOrg = AsyncReturnType<typeof getCoachOrganization>;

export async function getCoachOrganization(
  coach_id: string,
  event_id: number,
  org_id: number,
) {
  const { data, error } = await supabase
    .from("org_coaches")
    .select(
      "org_id, orgs(*, org_events(*, teams(*, student_events(*, students(*)))))",
    )
    .eq("org_id", org_id)
    .eq("orgs.org_events.event_id", event_id)
    .eq("coach_id", coach_id)
    .single();
  if (error) throw error;
  const teams = data.orgs.org_events[0].teams.map((t) => {
    const output = {
      front_id: t.front_id,
      team_id: t.team_id,
      team_name: t.team_name,
      members: t.student_events.map((s) => {
        return {
          front_id: s.front_id,
          student_event_id: s.student_event_id,
          user: s.students,
        };
      }),
    };
    return output;
  });

  const output = {
    event: data.orgs.org_events[0] as Omit<
      (typeof data.orgs.org_events)[0],
      "teams"
    >,
    teams: teams,
  };

  return output;
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
