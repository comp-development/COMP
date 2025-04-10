import { error } from "@sveltejs/kit";
import { supabase } from "../supabaseClient";
import { updateTestPuzzle } from "./puzzles";

export async function addProblem(problem) {
  const { data, error } = await supabase
    .from("problems")
    .insert(problem)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getAllProblems(
  host_id: number,
  customSelect: string = "*"
) {
  const { data, error } = await supabase
    .from("problems")
    .select("*")
    .eq("host_id", host_id);

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

export async function getAllProblemClarifications(problems) {
  const clarifications = {};

  for (const problem of problems) {
    try {
      const clarification = await getProblemClarification(
        problem.test_problem_id
      );
      if (!clarification || clarification.length <= 0) {
        throw new Error("no clarification found");
      }
      clarifications[problem.test_problem_id] = clarification[0];
    } catch (e) {
      clarifications[problem.test_problem_id] = {
        test_problem_id: problem.test_problem_id,
        clarification_latex: null,
      };
    }
  }

  return clarifications;
}

export async function updateProblemClarifications(clarifications) {
  for (const [key, clarification] of Object.entries(clarifications)) {
    clarifications[key] = await updateClarification(clarification);
  }

  return clarifications;
}

export async function updateClarification(clarification) {
  if ("clarification_id" in clarification) {
    const { error: probError } = await supabase
      .from("problem_clarifications")
      .update(clarification)
      .eq("clarification_id", clarification.clarification_id);

    if (probError) throw probError;
  } else if (clarification.clarification_latex != null) {
    const { data, error: probError } = await supabase
      .from("problem_clarifications")
      .insert(clarification)
      .select()
      .single();

    if (probError) throw probError;

    clarification = data;
  }

  return clarification;
}

export async function updateTestProblems(test_id: number, oldProblems, is_test_puzzle: boolean = false) {
  const problems = JSON.parse(JSON.stringify(oldProblems));
  for (const oldProblem of problems) {
    if (is_test_puzzle) {
      await updateTestPuzzle(test_id, oldProblem);
    } else {
      await updateTestProblem(test_id, oldProblem);
    }
  }
}

export async function updateTestProblem(test_id: number, oldProblem) {
  const problem = JSON.parse(JSON.stringify(oldProblem));
  const problem2 = JSON.parse(JSON.stringify(oldProblem));

  const { probError } = await supabase
    .from("problems")
    .update(problem.problems)
    .eq("problem_id", problem.problem_id);
  if (probError) throw probError;

  delete problem2["problems"];

  const { error } = await supabase
    .from("test_problems")
    .update(problem2)
    .eq("test_id", test_id)
    .eq("test_problem_id", problem2.test_problem_id);
  if (error) throw error;
}

export async function addNewTestProblem(
  problem_info,
  customSelect: string = "*"
) {
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
    .from("test_problems")
    .delete()
    .eq("test_problem_id", test_problem_id);
  if (error) throw error;
}

export async function replaceTestProblem(
  test_problem_id: number,
  new_problem_id: number,
  customSelect: string = "*"
) {
  const { data, error } = await supabase
    .from("test_problems")
    .update({ problem_id: new_problem_id })
    .eq("test_problem_id", test_problem_id)
    .select(customSelect)
    .single();
  if (error) throw error;

  return data;
}

export async function getGradedAnswers(test_problem_id: number) {
  const { data, error } = await supabase
    .from("graded_answer_count")
    .select("*")
    .eq("test_problem_id", test_problem_id);

  if (error) throw error;

  return data;
}

export async function updateGradedAnswers(gradedAnswers) {
  for (const gradedAnswer of gradedAnswers) {
    await updateGradedAnswer(gradedAnswer);
  }
}

export async function updateGradedAnswer(gradedAnswer) {
  const { data: data, error: error2 } = await supabase
    .from("graded_answers")
    .upsert(
      {
        correct: gradedAnswer.correct,
        problem_id: gradedAnswer.problem_id,
        answer_latex: gradedAnswer.answer_latex,
      },
      { onConflict: "problem_id, answer_latex" }
    )
    .select("*")
    .single();

  if (error2) throw error2;

  gradedAnswer.graded_answer_id = data.graded_answer_id;
}

export async function insertGradedAnswers(gradedAnswer) {
  if (gradedAnswer.answer_latex != null && gradedAnswer.answer_latex != "") {
    const { error: error2 } = await supabase.from("graded_answers").upsert(
      {
        correct: gradedAnswer.correct,
        problem_id: gradedAnswer.problem_id,
        answer_latex: gradedAnswer.answer_latex,
      },
      { onConflict: "problem_id, answer_latex" }
    );

    if (error2) throw error2;

    const { data, error } = await supabase
      .from("graded_answer_count")
      .select("*")
      .eq("test_problem_id", gradedAnswer.test_problem_id)
      .eq("answer_latex", gradedAnswer.answer_latex)
      .single();

    if (error) throw error;

    return data;
  }
}
