import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import dotenv from "dotenv";
import { user } from "$lib/sessionStore";
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// // all user inputs right here!!!
const numUsers = 10; // USER INPUT, should not go above 10 unless accounts for more students are created and registered for test below.
const event_id = 14;  // USER INPUT
const test_id = 78;  // USER INPUT
const max_iters = 100; // USER INPUT

// all user inputs right here!!!
// const numUsers = 100; // USER INPUT, should not go above 10 unless accounts for more students are created and registered for test below.
// const event_id = 1;  // USER INPUT
// const test_id = 1;  // USER INPUT
// const problem_ids = [1,2,3,4,5]; // Example problem IDs, USER INPUT
// const max_iters = 1000; // USER INPUT

let numSuccess: number = 0;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Create multiple Supabase clients
const supabaseClients = Array.from({ length: numUsers + 1 }, () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey)
);

async function get_test_taker_id(student_id: number, event_id: number, test_id: number, mySupabase): Promise<number | null> {
  try {
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

export async function extendTestTakerEndTime(
    supabase,
    test_taker_id: number
  ): Promise<void> {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  
    const { data, error } = await supabase
      .from("test_takers")
      .update({ end_time: oneHourFromNow })
      .eq("test_taker_id", test_taker_id);
  
    if (error) {
      console.error(`Failed to update end_time for test_taker_id=${test_taker_id}:`, error.message);
      throw error;
    }
  }



async function upsertTestAnswer(mySupabase, test_taker_id: number, test_problem_id: number, answer: string) {
  await mySupabase.rpc("upsert_test_answer", {
    p_answer: answer,
    p_test_taker_id: test_taker_id,
    p_test_problem_id: test_problem_id,
  });

//   if (error) {
//     console.log("FAILED", error);
//     throw error;
//   }
  console.log(`tried User ${test_taker_id} updated problem ${test_problem_id} with answer ${answer}`);
//   return data;
}

async function upsertGutsAnswer(mySupabase, test_taker_id: number, test_problem_id: number, answer: string) {
  const { error } = await mySupabase.from("manual_grades").upsert(payload, {
    onConflict: ["problem_id", "test_taker_id", "team_id"],
  });
}

async function runLoadTest() {
  const userData = [];



  // log in to a single admin!
  // 

  // log in to numUsers supabase obejcts
  for (let i = 1; i <= numUsers; i++) {

    if(numSuccess + 20 < i) {
        break;
    }
    const email = `student${i}@gmail.com`;
    const password = "super_secure_password_821";

    const supabase = supabaseClients[i];

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error(`AUTH ERROR for ${email}:`, authError);
      continue;
    }

    const test_taker_id = await get_test_taker_id(authData.user.id, event_id, test_id, supabase);
    if (!test_taker_id) {
        console.log(`Failed to get test_taker_id for ${email}`);
        continue;
    }
    if(i == 1) {
        await extendTestTakerEndTime(supabase, test_taker_id);
    }
    userData.push({ supabase, test_taker_id });
    numSuccess += 1;
    console.log(`num success {${numSuccess}}`);
    await delay(2000);
  }
//   console.log(userData);

  const lastUpdates = new Map<number, { problem_id: number; answer: string }>();


  for (let i = 0; i < max_iters; i++) {
    for (let userIndex = 0; userIndex < numSuccess; userIndex++) {
      const { supabase, test_taker_id } = userData[userIndex];
  
      const test_problem_id = problem_ids[Math.floor(Math.random() * problem_ids.length)];
      const answer = (i + (userIndex*max_iters)) .toString();
  
      await upsertTestAnswer(supabase, test_taker_id, test_problem_id, answer);
      if(userIndex % 50 == 0) {
          console.log(numSuccess, userIndex, i);
      }
    //   lastUpdates.set(test_taker_id, { problem_id: test_problem_id, answer });
    }
    await delay(1);
  }

  await delay(1000);


//   console.log("ANSWERS UPDATED");

//   for (const { supabase, test_taker_id } of userData) {
//     const lastUpdate = lastUpdates.get(test_taker_id);
//     if (!lastUpdate) continue;

//     const { problem_id, answer } = lastUpdate;

//     const { data: finalAnswer, error: fetchError } = await supabase
//       .from("test_answers")
//       .select("answer_latex")
//       .eq("test_taker_id", test_taker_id)
//       .eq("test_problem_id", problem_id)
//       .single();

//     if (fetchError) {
//       console.error(`Fetch error for test_taker_id ${test_taker_id}:`, fetchError.message);
//       continue;
//     }

//     if (finalAnswer.answer_latex !== answer) {
//       console.log(`TEST FAILED for test_taker_id ${test_taker_id}`);
//       console.log("Expected:", answer, "Got:", finalAnswer.answer_latex);
//       throw new Error("Test failed");
//     }
//   }

//   console.log("ALL ANSWERS VERIFIED ✅");


// in order to load test guys,
// i need to pick a team (among all of the users)
// 
}

runLoadTest();


// i want to pick one team
// i want to pick a problem number, this should work just fine!! (i will just make problems 1 - 4 a given set)

// i want to set an answer to all 4
// what i really want to load test, 1000 graders inputting answers to a thousand teams?

// which means I need to go register a thousand teams
// i lowkey should not need to add students to the event
// then, I can query the 1000 team ids by selecting using the team name and the event

// what i actually want



