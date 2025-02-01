import { supabase } from "../supabaseClient";

export async function getCoachOrganization(coach_id: string) {
    const { data, error } = await supabase
        .from('org_coaches')
        .select("org_id, orgs(*)")
        .eq('coach_id', coach_id);
    if (error) throw error;

    for (let i = 0; i < data.length; i++) {
        const teams = await getOrganizationTeams(data[i].org_id);
        data[i]["teams"] = teams;
    }

    return data;
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
            .select("*, students(*)")
            .eq("team_id", teamData[i].team_id)
            .order("front_id", { ascending: true });
        if (error) throw error;

        teamData[i]["teamMembers"] = data;
    }

    return teamData;
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

