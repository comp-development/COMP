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

export async function getGradedAnswers(test_problem_id: number, problem_id: number) {
    const { data, error } = await supabase
        .from("graded_answer_count")
        .select("*")
        .eq("test_problem_id", test_problem_id);

    if (error) throw error;

    console.log(data);

    data.forEach(async (value) => {
        const { data2, error2 } = await supabase
            .from("graded_answers")
            .select("*")
            //.eq("problem_id", problem_id)
            //.eq("answer_latex", value.answer_latex);
        
        if (error2) throw error2;

        console.log(data2);
        console.log(problem_id);
        console.log(value.answer_latex);
        
        if (data2 == null) {
            value.graded_answer_id = null;
        } else {
            value.problem_id = problem_id;
            value.graded_answer_id = data2.graded_answer_id;
        }

        console.log(value);
    })

    return data;
}

export async function updateGradedAnswers(gradedAnswers) {
    gradedAnswers.forEach(async (gradedAnswer) => {
        if (gradedAnswer.count == 0) {
            const { error } = await supabase
                .from('graded_answers')
                .delete()
                .eq("graded_answer_id", gradedAnswer.graded_answer_id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('graded_answers')
                .update({
                    "correct": gradedAnswer.correct,
                })
                .eq("graded_answer_id", gradedAnswer.graded_answer_id);

            if (error) throw error;
        }
    });
}

export async function insertGradedAnswers(gradedAnswer) {
    const { fetched, error2 } = await supabase
        .from("graded_answers")
        .select("*")
        .eq("problem_id", gradedAnswer.problem_id)
        .eq("answer_latex", gradedAnswer.answer_latex);
    
    if (error2 || fetched == null) {
        const { data, error } = await supabase
            .from('graded_answers')
            .insert(insertData)
            .select();
        
        if (error) throw error;
        
        gradedAnswer.graded_answer_id = data.graded_answer_id;
    } else {
        gradedAnswer.graded_answer_id = fetched.graded_answer_id;
    }

    return gradedAnswer;
}