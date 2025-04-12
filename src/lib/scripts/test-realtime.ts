import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import dotenv from "dotenv";
import { user } from "$lib/sessionStore";
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// all user inputs right here!!!
const numUsers = 100; // USER INPUT, should not go above 10 unless accounts for more students are created and registered for test below.
const event_id = 14;  // USER INPUT
const test_id = 78;  // USER INPUT

// const numUsers = 100; // USER INPUT, should not go above 10 unless accounts for more students are created and registered for test below.
// const event_id = 1;  // USER INPUT
// const test_id = 1;  // USER INPUT

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


  async function get_team_id(student_id: number, event_id: number, test_id: number, mySupabase): Promise<number | null> {
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
      return team_id;

    } catch (error) {
      console.error("Unexpected error:", error);
      return null;
    }
  }

async function runLoadTest() {
  const userData = [];

  // log in to numUsers supabase obejcts
  for (let i = 1; i <= numUsers; i++) {

    if(numSuccess + 8 < i) {
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

    const team_id = await get_team_id(authData.user.id, event_id, test_id, supabase);

    userData.push({ supabase, test_taker_id });
    numSuccess += 1;
    console.log(`num success {${numSuccess}}`);

    const channel = supabase
    .channel(
      "test-answers-for-taker-" +
        test_taker_id +
        "-page-" +
        1,
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "test_answers",
        filter: `test_taker_id=eq.${test_taker_id}`,
      },
      (payload) => {
        if (Math.random() < 0.01) {
          console.log(`hello from test_taker_id=${test_taker_id}${Math.random()}`);
        }
      },
    )
    .subscribe(); 
    

    await delay(2000);
  }
}

runLoadTest();


// rigiht now everyone is listening to changes to the exact same team
// i need to rerun this if we want different