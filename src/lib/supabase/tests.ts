import { supabase } from "../supabaseClient";

/** Fetches test problems given a test id. Ordered by problem number
 *
 * @param test_id number
 * @param customSelect optional, string
 * @returns Test problem data (TODO: change format)
 */
export async function getTestProblems(
	test_id: number,
	customSelect: string = "*,full_problems(*)",
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