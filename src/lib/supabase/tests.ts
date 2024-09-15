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
    console.log("GET TEST ANSWERS");
	console.log(test_taker_id);
	console.log(customSelect);
	let { data, error } = await supabase
		.from("test_answers")
		.select(customSelect)
		.eq("test_taker_id", test_taker_id);
	if (error) throw error;
	return data;
}

export async function getTest(test_id, customSelect = "*") {
    const { data, error } = await supabase
        .from("tests")
        .select(customSelect)
        .eq("test_id", test_id)
        .single();

    if (error) throw error;
    return data;
}

export async function addTestTaker(test_id) {
    console.log("TESTID",test_id)
    const { data, error } = await supabase
        .rpc('add_test_taker', {
            p_test_id: test_id,
        });

    if (error) { throw error; }
    
    console.log('Function result:', data);
    return data;
}

export async function upsertTestAnswer(test_taker_id: number, test_problem_id: number, answer: string) {
	console.log("adding", answer);
    console.log("TAKERID", test_taker_id)
    console.log("ANSWSER", answer)
	const { data, error } = await supabase
        .rpc('upsert_test_answer', {
            p_answer: answer,
            p_test_taker_id: test_taker_id,
            p_test_problem_id: test_problem_id
        });

    if (error) { throw error; }
    return data;
}

export async function getTestTaker(test_id, taker_id, is_team = false, customSelect = '*') {
    console.log(test_id, taker_id, is_team, customSelect);
    try {
        if (is_team) {
            // If it's a team-based test, retrieve the team_id from student_teams
            const { data: testTakerData, error: testTakerError } = await supabase
            .from('test_takers')
            .select(customSelect)
            .eq('test_id', test_id)
            .eq('team_id', taker_id)
            .single();
    
            if (testTakerError) throw testTakerError;
    
            return testTakerData;
        } else {
            // If it's an individual test, retrieve the test_takers row using student_id
            const { data: testTakerData, error: testTakerError } = await supabase
            .from('test_takers')
            .select(customSelect)
            .eq('test_id', test_id)
            .eq('student_id', taker_id)
            .single();
    
            if (testTakerError) throw testTakerError;
    
            return testTakerData;
        }
    } catch (error) {
        console.error('Error retrieving test taker:', error);
        return null;
    }
}

export async function updateOpeningTime(test_id, openingTime) {
    const { data, error } = await supabase
        .from('tests')
        .update({ opening_time: openingTime })
        .eq('test_id', test_id);

    if (error) {
        throw error;
    }

    return true;
}
