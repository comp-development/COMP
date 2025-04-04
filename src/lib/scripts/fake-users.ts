import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createFakeUsers() {
  for (let i = 1; i <= 10; i++) {
    const email = `student${i}@gmail.com`;
    const password = "student123";

    // Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.log(`Error creating user ${email}:`, authError.message);
      continue;
    }

    console.log(`User created: ${email}`);
    const userId = authData.user?.id;

    // Upsert into students table
    if (userId) {
      const { error: upsertError } = await supabase
        .from("students")
        .insert({
          first_name: "Test",
          student_id: authData.user?.id,
          last_name: "Student",
          email,
        });
      if (upsertError) {
        console.log(`Error upserting student ${email}:`, upsertError.message);
      } else {
        console.log(`Student upserted: ${email}`);
      }
    }

    // TODO: Programatically register
  }
}

createFakeUsers();
