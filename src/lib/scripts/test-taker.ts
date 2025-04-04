// src/routes/api/test-taker.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

import dotenv from "dotenv";
import { get } from "svelte/store";
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function upsertTestAnswer(
  test_taker_id: number,
  test_problem_id: number,
  answer: string,
) {
  const { data, error } = await supabase.rpc("upsert_test_answer", {
    p_answer: answer,
    p_test_taker_id: test_taker_id,
    p_test_problem_id: test_problem_id,
  });
  if (error) {
    console.log("FAILED", error);
    throw error;
  }
  console.log("DATA", data);
  return data;
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function get_test_taker_id(student_id: number, event_id: number, test_id: number, mySupabase): Promise<number | null> {
    try {
        // Step 1: Get the team_id from the student_event table
        const { data: studentEvent, error: studentEventError } = await mySupabase
            .from("student_events")
            .select("team_id")
            .eq("student_id", student_id)
            .eq("event_id", event_id)
            .single();

        if (studentEventError || !studentEvent) {
            console.error("Error fetching team_id:", studentEventError?.message);
            return null;
        }

        const team_id = studentEvent.team_id;

        // Step 2: Get the test_taker_id from the test_takers table
        const { data: testTaker, error: testTakerError } = await mySupabase
            .from("test_takers")
            .select("test_taker_id")
            .eq("test_id", test_id)
            .eq("team_id", team_id)
            .single();

        if (testTakerError || !testTaker) {
            console.error("Error fetching test_taker_id:", testTakerError?.message);
            return null;
        }

        return testTaker.test_taker_id;
    } catch (error) {
        console.error("Unexpected error:", error);
        return null;
    }
}

export async function GET() {

  // all user inputs right here
  const event_id = 1;
  const test_id = 1;
  const problem_ids = [4];

  const testUserEmail = "student@gmail.com";
  const testUserPassword = "student123";



  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testUserEmail,
    password: testUserPassword
  });

  if (authError) {
    console.log("AUTH ERROR", authError);
    return {
      status: 400,
      body: { error: authError.message }
    };
  }
  console.log("LOGGED IN");

  const test_taker_id = await get_test_taker_id(authData.user.id, event_id, test_id, supabase);
  const test_problem_id = 4;

  // need to input a test id 

  let final_answer = "20";
  const max_iters = 100;
  for (let i = 0; i <= max_iters; i++) {
    await upsertTestAnswer(test_taker_id, test_problem_id, i);
  }
  final_answer = max_iters.toString();

  // make sure the answer is update
  console.log("ANSWERS UPDATED");


  // how to delay here for a few seconds
  await delay(100);

  const { data: finalAnswer, error: fetchError } = await supabase
    .from("test_answers")
    .select("answer_latex")
    .eq("test_taker_id", test_taker_id)
    .eq("test_problem_id", test_problem_id)
    .single();

  if (fetchError) {
    return {
      status: 400,
      body: { error: fetchError.message }
    };
  }

  if(finalAnswer.answer_latex !== final_answer) {
      console.log("TEST FAILED");
      console.log(finalAnswer.answer_latex, final_answer);
      throw new Error("Test failed");
  }

  console.log("ANSWER IS CORRECT");


//   return {
//     status: 200,
//     body: { finalAnswer: finalAnswer?.answer, testPassed: finalAnswer?.answer_latex === final_answer }
//   };
}


GET();