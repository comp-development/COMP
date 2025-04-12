import type { Tables } from "../../../db/database.types";
import { supabase } from "../supabaseClient";

// These two constants control the number of scans that are fetched at a time.
const MIN_SCAN_INDEX = 0;
const MAX_SCAN_INDEX = 100;
// NOTE: const jsonData (a list of JSON dictionaries {scan_id: int, test_id: int}) is hard coded at the bottom of this file. Please update if necessary!

export async function uploadScan(
  file: any,
  host_id: string,
  compose_test_id: string,
  page_number: number,
  front_id: string,
) {
  if (compose_test_id.startsWith("ERROR")) {
    throw new Error(
      "Could not read Test QR code. Must manually input the Test ID before uploading.",
    );
  }
  if (front_id.startsWith("ERROR")) {
    throw new Error(
      "Could not read Team/Student QR code. Must manually input the Taker ID before uploading scans.",
    );
  }
  let { data, error: upload_error } = await supabase.storage
    .from("scans")
    .upload(
      `host_${host_id}/test_${compose_test_id}/${front_id}/page_${page_number}.png`,
      file,
      {
        upsert: true,
      },
    );
  if (upload_error) throw upload_error;

  let { data: id_data, error } = await supabase
    .from("tests")
    .select("test_id")
    .eq("compose_test_id", Number(compose_test_id))
    .single();
  if (error) throw error;

  let { error: upsert_error } = await supabase.from("scans").upsert(
    {
      test_id: id_data!.test_id,
      taker_id: front_id,
      page_number,
      scan_path: data!.path,
    },
    {
      onConflict: "test_id,taker_id,page_number",
    },
  );
  if (upsert_error) throw upsert_error;
}

export async function fetchNewProblem(grader_id: string, test_id: number) {
  const { data: problems, error: listError } = await supabase
    .rpc("get_next_problem", { in_test_id: test_id, target_grader: grader_id })
    .order("available_scans", { ascending: false })
    .limit(1);
  if (listError) {
    throw listError;
  }

  const problem = problems.at(0);
  if (!problem) return null;

  const { data: problem_data, error: problem_error } = await supabase
    .from("test_problems")
    .select(
      "problems(problem_latex, answer_latex, solution_latex), problem_number",
    )
    .eq("test_problem_id", problem.test_problem_id)
    .single();
  if (problem_error) throw problem_error;

  return {
    test_problem_id: problem.test_problem_id,
    problem_number: problem_data.problem_number,
    ...problem_data.problems,
  };
}

// If test_problem_id not specified (null), looks at other problem ids in the
// same test, starting with lower # of unique grader_id entries that are claimed
// but not graded (pending).
//
// Returns scans in groups of their problem ids sorted by # unique grader_id's,
// then sorted in increasing order by their claimed_count.
//
// All returned scans have graded_count < 2.
//
// If no scans, returns empty list.
export async function fetchNewScans(
  grader_id: string,
  batch_size: number,
  test_id: number,
  test_problem_id: number,
  filter_scan_ids: number[],
) {
  // TODO: handle conflicted
  // TODO: handle the fact that this may return problems that have been claimed by this grader but not graded
  // TODO: delete test_problem association for tiebreakers

  console.log("fetching more scans")
  const { data: scans, error: listError } = await supabase
    .rpc("get_test_problem_scans_state", {
      in_test_id: test_id,
      target_grader: grader_id,
    })
    .eq("test_problem_id", test_problem_id)
    .eq("grader_graded", false)
    .lt("total_grades", 2)
    .order("total_claims", { ascending: true })
    .not("scan_id", "in", `(${filter_scan_ids.join(",")})`)
    .limit(batch_size);
  if (listError) {
    throw listError;
  }

  // Mark that this grader claims these scans.
  const { error: newGradeError } = await supabase.from("scan_grades").upsert(
    scans.map((item) => ({
      grader_id,
      scan_id: item.scan_id,
      test_problem_id: item.test_problem_id,
    })),
    { onConflict: "grader_id, scan_id, test_problem_id" },
  );
  if (newGradeError) {
    throw newGradeError;
  }

  return scans;
}

export async function submitGrade(
  grader_id: string,
  fields: Partial<Tables<"scan_grades">>,
): Promise<{ grade_id: number }> {
  // if (data.is_override ?? false) {
  // 	const { data: existingRow, error } = await supabase
  // 		.from("grades")
  // 		.select("*")
  // 		.eq("scan_id", data.scan_id)
  // 		.eq("test_problem_id", data.test_problem_id)
  // 		.eq("is_override", true)
  // 		.single();
  // 	if (error) {
  // 		throw error;
  // 	}
  // 	if (existingRow) {
  // 		return;
  // 	}
  // }
  const { data, error } = await supabase
    .from("scan_grades")
    .upsert(
      { ...fields, grader_id },
      { onConflict: "grader_id,scan_id,test_problem_id" },
    )
    .select("grade_id")
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function undoGrade(grade_id: number): Promise<void> {
  const { error: updateGradeError } = await supabase
    .from("scan_grades")
    .update({ grade: null })
    .eq("grade_id", grade_id);
  if (updateGradeError) {
    throw updateGradeError;
  }
}

// export async function getGrades() {
//   const distinctPairs = Array.from(
//     new Set(jsonData.map((item: any) => [item.scan_id, item.test_id])),
//   );

//   console.log(distinctPairs);
//   let gradeTrackingData = [];
//   for (let i = MIN_SCAN_INDEX; i < MAX_SCAN_INDEX; i++) {
//     const pair = distinctPairs[i];
//     let { data, error } = await supabase
//       .from("grade_tracking")
//       .select("scan_id,test_id,correct")
//       .eq("grade_finalized", true)
//       .eq("scan_id", pair[0])
//       .eq("test_id", pair[1]);

//     gradeTrackingData.push(...data);
//   }

//   // let gradeTrackingData = [];
//   // let { data: , error: gradeTrackingError } = await supabase
//   // 	.from("grade_tracking")
//   // 	.select("scan_id,test_id,correct")
//   // 	.eq("grade_finalized", true)
//   // 	.limit(pageSize);
//   // if (gradeTrackingError) {
//   // 	throw gradeTrackingError;
//   // }
//   // gradeTrackingData.push(...data);
//   // while (data.length === pageSize) {

//   // 	({ data, error: gradeTrackingError } = await supabase
//   // 		.from("grade_tracking")
//   // 		.select("scan_id,test_id,correct")
//   // 		.eq("grade_finalized", true)
//   // 		.limit(pageSize));
//   // 	if (gradeTrackingError) {
//   // 		throw gradeTrackingError;
//   // 	}
//   // 	gradeTrackingData.push(...data);
//   // }
//   console.log("Constructed gradeTrackingDAta");
//   console.log(gradeTrackingData.length);
//   const scores = {};

//   const get_row = async (row) => {
//     const { data: testData, error: testError } = await supabase
//       .from("tests")
//       .select("test_name")
//       .eq("id", row.test_id)
//       .single();

//     if (testError) {
//       throw testError;
//     }

//     const test_name = testData.test_name;
//     if (!Object.keys(scores).includes(test_name)) {
//       scores[test_name] = {};
//     }

//     const { data: scanData, error: scanError } = await supabase
//       .from("scans")
//       .select("taker_id")
//       .eq("id", row.scan_id)
//       .single();
//     if (scanError) {
//       throw scanError;
//     }

//     const taker_id = scanData.taker_id;
//     if (typeof taker_id === "string" && /[A-Z]$/.test(taker_id)) {
//       // console.log("taker_id is a student");
//       // console.log(taker_id);
//       let team_num = taker_id.slice(0, -1);
//       // console.log(team_num);
//       let { data: team } = await supabase
//         .from("teams")
//         .select("id")
//         .eq("number", team_num)
//         .eq("tournament_id", 2)
//         .single();

//       // console.log(team.id);

//       const { data: teamStudentData, error: teamStudentError } = await supabase
//         .from("team_students")
//         .select("student_id")
//         .eq("team_id", team.id)
//         .eq("student_num", taker_id)
//         .single();

//       // console.log(teamStudentData.student_id);
//       // const { data: teamStudentData, error: teamStudentError } = await supabase
//       // 	.from("team_students")
//       // 	.select("student_id")
//       // 	.eq("student_num", taker_id)
//       // 	.single();
//       // if (teamStudentError) {
//       // 	throw teamStudentError;
//       // }

//       const { data: studentData, error: studentError } = await supabase
//         .from("students")
//         .select("first_name,last_name")
//         .eq("id", teamStudentData.student_id)
//         .single();
//       if (studentError) {
//         throw studentError;
//       }

//       if (!Object.keys(scores[test_name]).includes(taker_id)) {
//         scores[test_name][taker_id] = {
//           name: `${studentData.first_name} ${studentData.last_name}`,
//           score: 0,
//           grades: [],
//         };
//       }
//       scores[test_name][taker_id].score += row.correct ? 1 : 0;
//       scores[test_name][taker_id].grades.push(row.correct);
//     } else {
//       const { data: teamData, error: teamError } = await supabase
//         .from("teams")
//         .select("name")
//         // TODO: @tweoss. no hardcoding, make this per tournament and per test
//         .eq("tournament_id", 2)
//         .eq("number", taker_id)
//         .single();
//       if (teamError) {
//         throw teamError;
//       }
//       // console.log(test_name);
//       if (!Object.keys(scores[test_name]).includes(taker_id)) {
//         scores[test_name][taker_id] = {
//           name: teamData.name,
//           score: 0,
//           grades: [],
//         };
//       }
//       scores[test_name][taker_id].score += row.correct ? 1 : 0;
//       scores[test_name][taker_id].grades.push(row.correct);
//     }
//   };

//   await Promise.all(gradeTrackingData.map(get_row));
//   console.log(scores);
//   return scores;
// }
