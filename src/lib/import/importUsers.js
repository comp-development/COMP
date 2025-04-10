import csv from "csv-parser";
import fs from "fs";
import dotenv from "dotenv";
import { createObjectCsvWriter } from "csv-writer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Array to store all processed students with their IDs
const processedStudents = [];

// Function to process each student from the CSV
async function processStudent(student) {
  try {
    // Check if a student with the same email already exists
    let { data: existingStudent, error: fetchError } = await supabase
      .from("students")
      .select("*")
      .eq("email", student.email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // Error code PGRST116 = No match found
      console.error(
        `Error fetching student with email ${student.email}:`,
        fetchError,
      );
      return;
    }

    // Create a copy of the student object to store in the processed array
    const studentWithId = { ...student };

    // If the student already exists, update their information
    if (existingStudent) {
      const { error: updateError } = await supabase
        .from("students")
        .update({
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
          grade: student.grade,
        })
        .eq("email", student.email);

      if (updateError) {
        console.error(
          `Error updating student ${student.email}:`,
          updateError,
        );
      } else {
        console.log(
          `Updated student with email ${student.email}`,
        );
        // Add the existing student ID to the student object
        studentWithId.user_id = existingStudent.student_id;
        processedStudents.push(studentWithId);
      }
    } else {
      // If the student doesn't exist, create a new user in Supabase Auth
      const { data: newUser, error: createUserError } =
        await supabase.auth.admin.createUser({
          email: student.email,
          password: student.password,
          email_confirm: false, // Turn off email confirmation
        });

      if (createUserError) {
        console.error(
          `Error creating user for ${student.email}:`,
          createUserError,
        );
        return;
      }

      // Get the user ID
      const userId = newUser.user.id;

      // Insert the new student into the 'students' table with the new user's ID
      const { error: insertError } = await supabase.from("students").insert([
        {
          student_id: userId, // The user_id from the new Auth user
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
        },
      ]);

      if (insertError) {
        console.error(
          `Error inserting new student ${student.email}:`,
          insertError,
        );
      } else {
        console.log(
          `Inserted new student with email ${student.email}`,
        );
        // Add the new user ID to the student object
        studentWithId.user_id = userId;
        processedStudents.push(studentWithId);
      }
    }
  } catch (error) {
    console.error(`Error processing student ${student.email}:`, error);
  }
}

// Main function to handle the CSV processing
async function processCSV() {
  return new Promise((resolve, reject) => {
    fs.createReadStream("students.csv")
      .pipe(csv())
      .on("data", (student) => {
        // Process each student row in the CSV
        processStudent(student);
      })
      .on("end", async () => {
        console.log("Finished processing CSV.");
        
        // After all students are processed, write to a new CSV file
        try {
          // Wait for all student processing to complete
          await Promise.all(processedStudents.map(p => Promise.resolve(p)));
          
          // Get the headers from the first processed student
          const headers = processedStudents.length > 0 
            ? [...Object.keys(processedStudents[0])].map(key => ({ id: key, title: key }))
            : [];
          
          // Create CSV writer
          const csvWriter = createObjectCsvWriter({
            path: 'students_with_ids.csv',
            header: headers
          });
          
          // Write data to CSV
          await csvWriter.writeRecords(processedStudents);
          console.log('CSV file with user IDs has been written successfully');
          resolve();
        } catch (error) {
          console.error('Error writing CSV file:', error);
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("Error reading CSV:", error);
        reject(error);
      });
  });
}

// Execute the main function
processCSV().catch(error => {
  console.error("Error in CSV processing:", error);
});

export {}; 