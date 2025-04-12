import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import dotenv from "dotenv";
import { user } from "$lib/sessionStore";
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// // all user inputs right here!!!
const numUsers = 100; // USER INPUT, should not go above 10 unless accounts for more students are created and registered for test below.
const event_id = 14;  // USER INPUT
const test_id = 74;  // USER INPUT
const max_iters = 20; // USER INPUT
const problem_numbers= [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24, 25, 26, 27, 28]; // Example problem IDs, USER INPUT
// const problem_numbers= [1]; // Example problem IDs, USER INPUT



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

async function getTestProblemIdsForTest(test_id: number, problem_numbers: number[], mySupabase) {
  const test_problem_ids: string[] = [];

  for (const problem_number of problem_numbers) {
    const { data, error } = await mySupabase
      .from("test_problems")
      .select("test_problem_id")
      .eq("problem_number", problem_number)
      .eq("test_id", test_id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching test_problem_id for problem_number ${problem_number}:`, error);
      continue;
    }

    if (data?.test_problem_id) {
      test_problem_ids.push(data.test_problem_id);
    } else {
      console.warn(`No matching row found for problem_number ${problem_number}`);
    }
  }

  return test_problem_ids;
}

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




  async function get_team_id(index: number, event_id: number, test_id: number, mySupabase): Promise<number | null> {
    const team_name = `Team no student ${index} test`
    console.log(team_name)
    try {
      const { data: studentEvent, error: studentEventError } = await mySupabase
        .from("teams")
        .select("team_id")
        .eq("team_name", team_name)
        .eq("event_id", event_id)
        .single();
  
      if (studentEventError || !studentEvent) {
        console.error("Error fetching team_id:", studentEventError?.message);
        return null;
      }
  
      const team_id = studentEvent.team_id;
      return team_id;

    } catch (error) {
      console.error("Unexpected error:", error);
      return null;
    }
  }



async function upsertGutsAnswer(mySupabase, test_problem_id: number, team_id: number, test_id: number) {

  // random booolean of true or false

  const status = Math.random() < 0.5 ? "correct" : "incorrect";
  const payload = {
    test_problem_id,
    team_id,
    status,
    test_id
  };
  const { error } = await mySupabase.from("manual_grades").upsert(
    payload, {
      onConflict: ["test_problem_id", "team_id"],
    }
  );



  if (error) {
    console.log("Error saving manual answers:", error.message);
  } 
//   if (error) {
//     console.log("FAILED", error);
//     throw error;
//   }
  console.log(`tried team ${team_id} updated problem ${test_problem_id} with status ${status}`);
//   return data;
}

async function runLoadTest() {
  const userData = [];

  // log in to numUsers supabase obejcts
  for (let i = 1; i <= numUsers; i++) {

    if(numSuccess + 20 < i) {
        break;
    }
    const email = `teststudeadmin`;
    const password = "teststudenadmin";

    const supabase = supabaseClients[i];

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error(`AUTH ERROR for ${email}:`, authError);
      continue;
    }

    // I have now logged in as an admin

    // i need to grab the corresponding team_id
    const team_id = await get_team_id(i, event_id, test_id, supabase);

    // from there, I want to grab my respective test_takers_id
    userData.push({ supabase, team_id});
    numSuccess += 1;
    console.log(`num success {${numSuccess}}`);
    await delay(1);
  }

  // grab all of the corresponding test problem ids(which should be correct)
  const test_problem_ids = await getTestProblemIdsForTest(test_id, problem_numbers, supabaseClients[0]);

  console.log(test_problem_ids);
//   console.log(userData);


  // we're gonna

  for (let i = 0; i < max_iters; i++) {
    for (let problemIndex = 0; problemIndex < test_problem_ids.length; problemIndex++) {
      const test_problem_id = test_problem_ids[problemIndex];

      for (let userIndex = 0; userIndex < numSuccess; userIndex++) {
        const { supabase, team_id } = userData[userIndex];
  
  
        await upsertGutsAnswer(supabase, test_problem_id, team_id, test_id);

      }
    }

    // go through each problem for a given test
    // take a user, grab their test, update the manual field"
  
  }

  await delay(1500);


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


// i want to pick 1000 teams (One with each user)
// update each answer one

// i want to pick a problem number, this should work just fine!! (i will just make problems 1 - 4 a given set)

// i want to set an answer to all 4
// what i really want to load test, 1000 graders inputting answers to a thousand teams?

// which means I need to go register a thousand teams
// i lowkey should not need to add students to the event
// then, I can query the 1000 team ids by selecting using the team name and the event

// what i actually want



