import { supabase } from "../supabaseClient";

export async function getProblemClarification(problem_id: number) {
    const { data, error } = await supabase
        .from("problem_clarifications")
        .select("*")
        .eq("test_problem_id", problem_id);
        
    if (error) throw error;
    return data;
}