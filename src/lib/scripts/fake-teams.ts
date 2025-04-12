import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// const event_id = 14; // USER INPUT;
// const test_id = 78; // USER INPUT;
// const student_nums= 1000; // USER INPUT;
// const same_team = true; // USER INPUT;

const event_id = 14; // USER INPUT;
const student_nums= 1000; // USER INPUT;
const same_team = true; // USER INPUT;


// team 1327 up to team 1425

async function createFakeUsers() {
  let perm_team_id : string | null = 1;

  const email = `student1@gmail.com`;
  const password = "test_smthing";

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });


  for (let i = 1; i <= student_nums; i++) {
    const { data: team_id, error: teamError } = await supabase
        .from("teams")
        .insert({
            team_name: `Team no student ${i} test`,
            event_id: event_id,
            join_code: `T-student${i}`,
            front_id: 'Team{i}'
        })
        .select("team_id") // specify the fields you want to return
        .single();
  }
}

createFakeUsers();
