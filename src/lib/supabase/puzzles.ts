import { supabase } from "../supabaseClient";

export async function getAllPuzzles(
  host_id: number,
  customSelect: string = "*"
) {
  const { data, error } = await supabase
    .from("puzzles")
    .select(customSelect)
    .eq("host_id", host_id);

  if (error) throw error;
  return data;
}

export async function insertPuzzle(
  puzzle: [],
  solution: [],
  host_id: number,
  customSelect: string = "*"
) {
  const { data, error } = await supabase
    .from("puzzles")
    .insert({ puzzle, solution, host_id })
    .select(customSelect)
    .single();

  if (error) throw error;

  return data;
}

export async function updateTestPuzzle(test_id: number, oldProblem) {
  const problem = JSON.parse(JSON.stringify(oldProblem));
  const problem2 = JSON.parse(JSON.stringify(oldProblem));

  const { probError } = await supabase
    .from("puzzles")
    .update(problem.puzzles)
    .eq("puzzle_id", problem.puzzle_id);
  if (probError) throw probError;

  delete problem2["puzzles"];

  const { error } = await supabase
    .from("test_problems")
    .update(problem2)
    .eq("test_id", test_id)
    .eq("test_problem_id", problem2.test_problem_id);
  if (error) throw error;
}

export async function replaceTestPuzzle(
  test_problem_id: number,
  new_puzzle_id: number,
  customSelect: string = "*"
) {
  const { data, error } = await supabase
    .from("test_problems")
    .update({ puzzle_id: new_puzzle_id })
    .eq("test_problem_id", test_problem_id)
    .select(customSelect)
    .single();
  if (error) throw error;

  return data;
}