import { supabase } from "../supabaseClient";

export async function getGradedTestAnswers(
  test_id,
  customSelect: string = "*",
) {
  const { data, error } = await supabase
    .from("graded_test_answers")
    .select(customSelect)
    .eq("test_id", test_id);

  console.log("GRADED_TEST", data)

  if (error) throw error;
  return data;
}
