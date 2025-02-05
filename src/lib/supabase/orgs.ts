import { supabase } from "../supabaseClient";

export async function getOrganization(org_id: number) {
    const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("org_id", org_id)
        .single();
    if (error) throw error;

    const { data: coachData, error: coachError } = await supabase
        .from('org_coaches')
        .select("*, person:coaches(*)")
        .eq('org_id', org_id);
    if (coachError) throw coachError;

    return { ...data, coaches: coachData };
}

export async function getCoachOrganization(coach_id: string, event_id: number) {
    const data = await getCoachOrganizations(coach_id);
    for (let i = 0; i < data.length; i++) {
        const teams = await getOrganizationTeams(data[i].org_id);
        data[i]["teams"] = teams;
        const events = await ifOrgEvent(event_id, data[i].org_id);
        data[i]["event"] = events;
    }

    return data;
}

export async function getCoachOrganizations(coach_id: string) {
    const { data, error } = await supabase
        .from('org_coaches')
        .select("org_id, orgs(*)")
        .eq('coach_id', coach_id);
    if (error) throw error;
    return data;
}

export async function addCoachToOrganization(coach_id: string, org_id: number) {
    const { data, error } = await supabase
        .from('org_coaches')
        .insert([{ coach_id, org_id, }])
        .select("*, person:coaches(*)")
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function removeCoachFromOrganization(coach_id: string, org_id: number) {
    const { error } = await supabase
        .from('org_coaches')
        .delete()
        .match({ coach_id, org_id });

    if (error) throw error;
}

export async function getOrganizationTeams(org_id: number) {
    const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq('org_id', org_id);
    if (teamError) throw teamError;

    for (let i = 0; i < teamData.length; i++) {
        const { data, error } = await supabase
            .from("student_events")
            .select("*, students (*)")
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
        .eq("org_id", org_id);
    if (error) throw error;

    return data;
}

export async function getOrgEventByJoinCode(event_id: number, join_code: string) {
    const { data, error } = await supabase
        .from("org_events")
        .select("*")
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
            onConflict: 'event_id,org_id'
        })
        .select("*")
        .single();
    if (error) throw error;

    return data;
}

export async function editOrganization(org: {}, org_id: number) {  
    const { data, error } = await supabase
        .from("orgs")
        .update({
            name: org.name,
            address: org.address
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
            address: org.address
        })
        .select()
        .single();
    if (orgError) throw orgError;

    const { data: orgCoachData, error: orgCoachError } = await supabase
        .from("org_coaches")
        .insert({
            org_id: orgData.org_id,
            coach_id: coachId
        })
        .select()
        .single();
    if (orgCoachError) throw orgCoachError;

    return { org: orgData, orgCoach: orgCoachData };
}