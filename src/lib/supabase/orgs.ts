import { supabase } from "../supabaseClient";

export async function getCoachOrganization(coach_id: string) {
    const { data, error } = await supabase
        .from('org_coaches')
        .select("org_id, orgs(*)")
        .eq('coach_id', coach_id);
    if (error) throw error;

    //coach can own multiple organizations

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