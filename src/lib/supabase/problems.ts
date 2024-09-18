import { supabase } from "../supabaseClient";

export async function getAllProblems(customSelect: string = "*") {
    const { data, error } = await supabase
        .from("problems")
        .select("*");
        
    if (error) throw error;
    return data;
}

export async function getProblemClarification(problem_id: number) {
    const { data, error } = await supabase
        .from("problem_clarifications")
        .select("*")
        .eq("test_problem_id", problem_id);
        
    if (error) throw error;
    return data;
}

export async function updateTestProblems(test_id: number, problems) {
    problems.forEach(async (problem) => {
        const { probError } = await supabase
            .from("problems")
            .update(problem.problems)
            .eq("problem_id", problem.problems.problem_id);
        
        if (probError) throw probError;

        delete problem["problems"]

        const { error } = await supabase
            .from("test_problems")
            .update(problem)
            .eq("test_id", test_id)
            .eq("test_problem_id", problem.test_problem_id);
            
        if (error) throw error;
    });
}