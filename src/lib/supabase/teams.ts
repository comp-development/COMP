import { supabase } from "../supabaseClient";

export async function getTeam(student_id, customSelect = "*") {
    try {
        // First, get the team_id for the given student_id
        const { data: studentTeamData, error: studentTeamError } = await supabase
            .from('student_events')
            .select('team_id')
            .eq('student_id', student_id)

        if (studentTeamError) throw studentTeamError;

        if (!studentTeamData || studentTeamData.length <= 0) {
            // If no team is found for the student
            return null;
        }

        // Now, get the team details using the team_id
        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select(customSelect)
            .eq('team_id', studentTeamData[0].team_id)
            .single();

        if (teamError) throw teamError;

        const { data, error } = await supabase
            .from('student_events')
            .select('*, students(first_name, last_name)')
            .eq('team_id', studentTeamData[0].team_id);
        
        if (error) throw error;

        teamData["teamMembers"] = data;

        return teamData;
    } catch (error) {
        console.error('Error retrieving team:', error);
        throw error;
    }
}

export async function getTeamId(student_id, customSelect = "*") {
    try {
        // First, get the team_id for the given student_id
        const { data: studentTeamData, error: studentTeamError } = await supabase
            .from('student_events')
            .select('team_id')
            .eq('student_id', student_id)
            .single();

        if (studentTeamError) throw studentTeamError;

        if (!studentTeamData) {
            // If no team is found for the student
            return null;
        }
        return studentTeamData.team_id
    } catch (error) {
        console.error('Error retrieving team ID:', error);
        throw error;
    }
}