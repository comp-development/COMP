import { supabase } from "../supabaseClient";

export async function createTest(testData: {}) {
  const { data, error } = await supabase
    .from("tests")
    .insert([testData])
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function editTest(test_id: number, testData: {}) {
  const { data, error } = await supabase
    .from("tests")
    .update(testData)
    .eq("test_id", test_id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/** Fetches test problems given a test id. Ordered by problem number
 *
 * @param test_id number
 * @param customSelect optional, string
 * @returns Test problem data (TODO: change format)
 */
export async function getTestProblems(
  test_id: number,
  page_num: number | null = null,
  customSelect: string = "*"
) {
  if (page_num) {
    let { data, error } = await supabase
      .from("test_problems")
      .select(customSelect)
      .eq("test_id", test_id)
      .eq("page_number", page_num)
      .order("problem_number");
    if (error) throw error;
    return data;
  } else {
    let { data, error } = await supabase
      .from("test_problems")
      .select(customSelect)
      .eq("test_id", test_id)
      .order("problem_number");
    if (error) throw error;
    return data;
  }
}

export async function fetchTestProblems(test_taker_id: number) {
  const { data, error } = await supabase.rpc("fetch_test_problems", {
    p_test_taker_id: test_taker_id,
  });
  if (error) {
    throw error;
  }
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

export async function getTest(test_id, detailed = false, customSelect = "*") {
  const { data, error } = await supabase
    .from(detailed ? "tests_detailed" : "tests")
    .select(customSelect)
    .eq("test_id", test_id)
    .single();

  if (error) throw error;
  return data;
}

export async function getTestFromComposeId(
  compose_test_id,
  detailed = false,
  customSelect = "*"
) {
  const { data, error } = await supabase
    .from(detailed ? "tests_detailed" : "tests")
    .select(customSelect)
    .eq("compose_test_id", compose_test_id)
    .single();

  if (error) throw error;
  return data;
}

export async function getGutsTest(test_id, customSelect = "*") {
  const { data, error } = await supabase
    .from("guts_tests")
    .select(customSelect)
    .eq("test_id", test_id)
    .single();

  if (error) throw error;
  return data;
}

export async function addTestTaker(test_id) {
  console.log("TESTID", test_id);
  const { data, error } = await supabase.rpc("add_test_taker", {
    p_test_id: test_id,
  });
  console.log("ERROR", error);
  if (error) {
    throw error;
  }

  console.log("Function result:", data);
  return data;
}

export async function upsertTestAnswer(
  test_taker_id: number,
  test_problem_id: number,
  answer: string
) {
  // console.log("adding", answer);
  // console.log("TAKERID", test_taker_id);
  // console.log("ANSWSER", answer);
  const { data, error } = await supabase.rpc("upsert_test_answer", {
    p_answer: answer,
    p_test_taker_id: test_taker_id,
    p_test_problem_id: test_problem_id,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function changePage(test_taker_id: number, page_number: string) {
  console.log("PAGE CHANGE", test_taker_id, page_number);
  const { data, error } = await supabase.rpc("change_page", {
    p_test_taker_id: test_taker_id,
    p_page_number: page_number,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function getAllTestTakers(customSelect = "*") {
  try {
    const { data: testTakerData, error: testTakerError } = await supabase
      .from("test_takers")
      .select(customSelect);

    if (testTakerError) {
      console.error("Error fetching test takers:", testTakerError.message);
      throw testTakerError;
    }

    return testTakerData;
  } catch (error) {
    console.error("Error in getAllTestTakers function:", error.message);
    throw error;
  }
}

export async function getTestTaker(
  test_id,
  taker_id,
  is_team = false,
  customSelect = "*"
) {
  console.log(test_id, taker_id, is_team, customSelect);
  try {
    if (is_team) {
      // If it's a team-based test, retrieve the team_id from student_events
      const { data: testTakerData, error: testTakerError } = await supabase
        .from("test_takers")
        .select(customSelect)
        .eq("test_id", test_id)
        .eq("team_id", taker_id)
        .maybeSingle();

      if (testTakerError && testTakerError.code != "PGRST116")
        throw testTakerError;

      return testTakerData;
    } else {
      // If it's an individual test, retrieve the test_takers row using student_id
      const { data: testTakerData, error: testTakerError } = await supabase
        .from("test_takers")
        .select(customSelect)
        .eq("test_id", test_id)
        .eq("student_id", taker_id)
        .maybeSingle();

      if (testTakerError && testTakerError.code != "PGRST116")
        throw testTakerError;

      return testTakerData;
    }
  } catch (error) {
    console.error("Error retrieving test taker:", error);
    return null;
  }
}

export async function getTestTakers(
  test_id,
  detailed = false,
  customSelect = "*"
) {
  const { data, error } = await supabase
    .from(detailed ? "test_takers_detailed" : "test_takers")
    .select(customSelect)
    .eq("test_id", test_id);
  if (error) throw error;
  return data;
}

export async function updateTest(test_id, testData) {
  const { data, error } = await supabase
    .from("tests")
    .update(testData)
    .eq("test_id", test_id);

  if (error) {
    throw error;
  }

  return true;
}

export async function insertTest(testData) {
  const { data, error } = await supabase.from("tests").insert([testData]);

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertTest(testData) {
  const { data, error } = await supabase
    .from("tests")
    .upsert(testData, {
      onConflict: "compose_test_id",
      returning: "representation",
      // ignoreDuplicates: false,
    })
    .select();

  if (error) {
    throw error;
  }
  return data;
}

export async function upsertTestProblems(testData) {
  if (testData.length === 0) {
    console.log("No test data provided for upsert.");
    return [];
  }
  console.log("testData", testData);
  const { data, error } = await supabase
    .from("test_problems")
    .upsert(testData, {
      onConflict: ["test_id", "problem_id"],
      returning: "representation",
      // ignoreDuplicates: false,
    })
    .select();
  console.log("error is coooooked brotha", error);
  console.log("data is coooooked brotha", testData);
  if (error) {
    console.error("Error upserting test problems:", error);
    throw error;
  }
  console.log("Upserted test problems successfully:", data);
  return data;
}

export async function upsertIntoBucket(
  host_id: number,
  problemImages: Array<{ path: string; base64: string }>,
  bucketName = "problem-images"
) {
  for (const imageData of problemImages) {
    // Convert base64 to Uint8Array
    const binaryString = atob(imageData.base64);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    // Create Blob (use appropriate MIME type if known)
    const blob = new Blob([uint8Array], { type: "image/png" });

    // Upload with upsert capability
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`host_${host_id}/` + imageData.path, blob, {
        upsert: true,
      });

    if (uploadError) return { error: uploadError };
    console.log(`Uploaded ${imageData.path}:`, uploadData);
  }
  console.log("All images processed successfully.");
  return { data: [] };
}

export async function upsertProblems(problemData) {
  const { data, error } = await supabase
    .from("problems")
    .upsert(problemData, {
      onConflict: "compose_problem_id",
      // returning: "representation",
      // ignoreDuplicates: false,
    })
    .select();

  if (error) {
    throw error;
  }
  return data;
}
