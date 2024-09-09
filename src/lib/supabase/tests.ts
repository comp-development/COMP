import { supabase } from "../supabaseClient";

/** Fetches test problems given a test id. Ordered by problem number
 *
 * @param test_id number
 * @param customSelect optional, string
 * @returns Test problem data (TODO: change format)
 */
export async function getTestProblems(
	test_id: number,
	customSelect: string = "*",
) {
	let { data, error } = await supabase
		.from("test_problems")
		.select(customSelect)
		.eq("test_id", test_id)
		.order("problem_number");
	if (error) throw error;
	return data;
}

/**
 * Gets the feedback for the problems in a particular testsolve
 *
 * @param testsolve_id number
 * @param customSelect optional, string
 * @returns list of testsolve answers
 */
export async function getTestAnswers(
	test_taker_id: number,
	customSelect: string = "*"
) {
	console.log(test_taker_id);
	console.log(customSelect);
	let { data, error } = await supabase
		.from("test_answers")
		.select(customSelect)
		.eq("test_taker_id", test_taker_id);
	if (error) throw error;
	return data;
}



export async function upsertTestAnswer(test_taker_id, test_problem_id, answer) {
	console.log("adding", answer);
    console.log("TAKERID", test_taker_id)
	const { data, error } = await supabase
        .rpc('upsert_test_answer', {
            p_answer: answer,
            p_test_taker_id: test_taker_id,
            p_test_problem_id: test_problem_id
        });

    if (error) {
        console.error('Error calling function:', error);
    } else {
        console.log('Function result:', data);
    }
}

export async function getTestTaker(test_id, student_id, customSelect = '*') {
    console.log(test_id, student_id, customSelect);
    try {
        // First, check if the test is a team-based test
        const { data: testData, error: testError } = await supabase
            .from('tests')
            .select('is_team')
            .eq('test_id', test_id)
            .single();
    
        if (testError) throw testError;
    
        const isTeamTest = testData.is_team;
        console.log(isTeamTest)
    
        if (isTeamTest) {
            // If it's a team-based test, retrieve the team_id from student_teams
            console.log("USER",student_id)
            const { data: teamData, error: teamError } = await supabase
            .from('student_teams')
            .select('team_id')
            .eq('student_id', student_id)
            .single();
            console.log(teamError)
            if (teamError) throw teamError;
    
            const team_id = teamData.team_id;
            console.log("TEAM", team_id)
            console.log("TEST", test_id)
            // Fetch the test_takers row based on the team_id
            const { data: testTakerData, error: testTakerError } = await supabase
            .from('test_takers')
            .select(customSelect)
            .eq('test_id', test_id)
            .eq('team_id', team_id)
            .single();
            console.log(testTakerError)
            if (testTakerError) throw testTakerError;
            console.log(testTakerData)
            return testTakerData;
        } else {
            // If it's an individual test, retrieve the test_takers row using student_id
            const { data: testTakerData, error: testTakerError } = await supabase
            .from('test_takers')
            .select(customSelect)
            .eq('test_id', test_id)
            .eq('student_id', student_id)
            .single();
    
            if (testTakerError) throw testTakerError;
    
            return testTakerData;
        }
    } catch (error) {
        console.error('Error retrieving test taker:', error);
        return null;
    }
}
