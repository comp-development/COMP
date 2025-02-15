import csv from 'csv-parser';
import fs from 'fs';

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to process each student from the CSV
async function processStudent(student) {
  try {
    // Check if a student with the same contestdojo_id already exists
    let { data: existingStudent, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('contestdojo_id', student.contestdojo_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {  // Error code PGRST116 = No match found
      console.error(`Error fetching student with contestdojo_id ${student.contestdojo_id}:`, fetchError);
      return;
    }

    // If the student already exists, update their information
    if (existingStudent) {
      const { error: updateError } = await supabase
        .from('students')
        .update({
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
          grade: student.grade
        })
        .eq('contestdojo_id', student.contestdojo_id);

      if (updateError) {
        console.error(`Error updating student ${student.contestdojo_id}:`, updateError);
      } else {
        console.log(`Updated student with contestdojo_id ${student.contestdojo_id}`);
      }

    } else {
      // If the student doesn't exist, create a new user in Supabase Auth
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: student.email,
        password: student.password,
        email_confirm: false,  // Turn off email confirmation
      });

      if (createUserError) {
        console.error(`Error creating user for ${student.email}:`, createUserError);
        return;
      }

      // Insert the new student into the 'students' table with the new user's ID
      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          student_id: newUser.id,  // The user_id from the new Auth user
          contestdojo_id: student.contestdojo_id,
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
          grade: student.grade
        }]);

      if (insertError) {
        console.error(`Error inserting new student ${student.contestdojo_id}:`, insertError);
      } else {
        console.log(`Inserted new student with contestdojo_id ${student.contestdojo_id}`);
      }
    }
  } catch (error) {
    console.error(`Error processing student ${student.contestdojo_id}:`, error);
  }
}

// Parse the CSV and process each row
fs.createReadStream('students.csv')
  .pipe(csv())
  .on('data', (student) => {
    // Process each student row in the CSV
    processStudent(student);
  })
  .on('end', () => {
    console.log('Finished processing CSV.');
  });

export {};
