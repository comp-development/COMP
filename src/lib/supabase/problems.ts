import { error } from "@sveltejs/kit";
import { supabase } from "../supabaseClient";

export async function addProblem(problem) {
    const { error } = await supabase
        .from("problems")
        .insert(problem);

    if (error) throw error;
}

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
        console.log(problem);
        const { probError } = await supabase
            .from("problems")
            .update(problem.problems)
            .eq("problem_id", problem.problem_id);

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

export async function addNewTestProblem(problem_info, customSelect: string = "*") {
    const { data, error } = await supabase
        .from("test_problems")
        .insert(problem_info)
        .select(customSelect)
        .single();
    if (error) throw error;

    return data;
}

export async function deleteTestProblem(test_problem_id: number) {
    const { error } = await supabase
        .from('test_problems')
        .delete()
        .eq('test_problem_id', test_problem_id);
    if (error) throw error;
}

export async function replaceTestProblem(test_problem_id: number, new_problem_id: number, customSelect: string = "*") {
    const { data, error } = await supabase
        .from('test_problems')
        .update({ "problem_id": new_problem_id })
        .eq('test_problem_id', test_problem_id)
        .select(customSelect)
        .single();
    if (error) throw error;

    return data;
}

export async function getGradedAnswers(problem_id: number) {
    const { data, error } = await supabase
        .from("graded_answers")
        .select("*")
        .eq("problem_id", problem_id);

    if (error) throw error;

    return data;
}

export async function updateGradedAnswers(gradedAnswers) {
    gradedAnswers.forEach(async (gradedAnswer) => {
        const { error } = await supabase
            .from('graded_answers')
            .update(gradedAnswer)
            .eq('graded_answer_id', gradedAnswer.graded_answer_id);

        if (error) throw error;
    });
}