import csv from 'csv-parser';
import fs from 'fs';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../../.env') });

// Initialize Supabase client with your Supabase URL and service key
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the event_id constant
const event_id = 3;

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
        email_confirm: true,  // Turn off email confirmation
      });

      if (createUserError) {
        console.error(`Error creating user for ${student.email}:`, createUserError);
        return;
      }

      // Insert the new student into the 'students' table with the new user's ID
      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          student_id: newUser.user.id,  // The user_id from the new Auth user
          contestdojo_id: student.contestdojo_id,
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
          grade: student.grade,
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

const delay = ms => new Promise(res => setTimeout(res, ms))

// New function to process each team from the CSV
async function processTeam(team) {
  try {
    // Check if a team with the same contestdojo_id already exists
    let { data: existingTeam, error: fetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('contestdojo_id', team.contestdojo_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching team with contestdojo_id ${team.contestdojo_id}:`, fetchError);
      return;
    }

    if (existingTeam) {
      // If the team already exists, update their information
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          team_name: team.team_name,
          division: team.division,
          front_id: team.front_id,
          event_id: event_id
        })
        .eq('contestdojo_id', team.contestdojo_id);

      if (updateError) {
        console.error(`Error updating team ${team.contestdojo_id}:`, updateError);
      } else {
        console.log(`Updated team with contestdojo_id ${team.contestdojo_id}`);
      }
    } else {
      // If the team doesn't exist, insert a new row
      const { error: insertError } = await supabase
        .from('teams')
        .insert([{
          contestdojo_id: team.contestdojo_id,
          team_name: team.team_name,
          division: team.division,
          front_id: team.front_id,
          event_id: event_id
        }]);

      if (insertError) {
        console.error(`Error inserting new team ${team.contestdojo_id}:`, insertError);
      } else {
        console.log(`Inserted new team with contestdojo_id ${team.contestdojo_id}`);
      }
    }
  } catch (error) {
    console.error(`Error processing team ${team.contestdojo_id}:`, error);
  }
}

// Get the current file's directory
const currentDir = dirname(fileURLToPath(import.meta.url));
//console.log('Current directory:', currentDir);

// Construct the path to the CSV file
const csvFilePath = join(currentDir, 'students.csv');
//console.log('CSV file path:', csvFilePath);

// Check if the file exists
if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: The file ${csvFilePath} does not exist.`);
  process.exit(1);
}

// If the file exists, proceed with reading
function processStudentsCSV() {
  const studentsFilePath = join(currentDir, 'students.csv');
  //console.log('Student CSV file path:', studentsFilePath);

  if (!fs.existsSync(studentsFilePath)) {
    console.error(`Error: The file ${studentsFilePath} does not exist.`);
    return;
  }

  const studentsReadStream = fs.createReadStream(studentsFilePath);

  studentsReadStream.on('error', (error) => {
    console.error(`Error reading CSV file: ${error.message}`);
  });

  studentsReadStream
    .pipe(csv())
    .on('data', async (student) => {
      // Process each student row in the CSV
      await processStudent(student);
      await processStudentEvent(student)
    })
    .on('end', () => {
      console.log('Finished processing Students CSV.');
    });
}


// Function to process teams CSV
function processTeamsCSV() {
  const teamsFilePath = join(currentDir, 'teams.csv');
  //console.log('Teams CSV file path:', teamsFilePath);

  if (!fs.existsSync(teamsFilePath)) {
    console.error(`Error: The file ${teamsFilePath} does not exist.`);
    return;
  }

  const teamsReadStream = fs.createReadStream(teamsFilePath);

  teamsReadStream.on('error', (error) => {
    console.error(`Error reading teams CSV file: ${error.message}`);
  });

  teamsReadStream
    .pipe(csv())
    .on('data', async (team) => {
      //console.log("PROCESS", team)
      await processTeam(team);
    })
    .on('end', async () => {
      console.log('Finished processing teams CSV.');
    });
}

// New function to process student_events
async function processStudentEvent(student) {
  try {
    // Get the student_id from the students table
    let { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('student_id')
      .eq('contestdojo_id', student.contestdojo_id)
      .single();

    if (studentError) {
      console.error(`Error fetching student_id for ${student.contestdojo_id}:`, studentError);
      return;
    }

    let teamId = null;
    if (student.team_contestdojo_id) {
      // Get the team_id from the teams table
      let { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('team_id')
        .eq('contestdojo_id', student.team_contestdojo_id)
        .single();

      if (teamError) {
        console.error(`Error fetching team_id for ${student.team_contestdojo_id}:`, teamError);
      } else {
        teamId = teamData.team_id;
      }
    }

    // Check if a student_event entry already exists
    let { data: existingEntry, error: fetchError } = await supabase
      .from('student_events')
      .select('*')
      .eq('student_id', studentData.student_id)
      .eq('event_id', event_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching student_event for ${student.contestdojo_id}:`, fetchError);
      return;
    }

    const studentEventData = {
      student_id: studentData.student_id,
      event_id: event_id,
      front_id: student.front_id,
      division: student.division,
      team_id: teamId
    };

    if (existingEntry) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('student_events')
        .update(studentEventData)
        .eq('student_id', studentData.student_id)
        .eq('event_id', event_id);

      if (updateError) {
        console.error(`Error updating student_event for ${student.contestdojo_id}:`, updateError);
      } else {
        console.log(`Updated student_event for contestdojo_id ${student.contestdojo_id}`);
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase
        .from('student_events')
        .insert([studentEventData]);

      if (insertError) {
        console.error(`Error inserting student_event for ${student.contestdojo_id}:`, insertError);
      } else {
        console.log(`Inserted new student_event for contestdojo_id ${student.contestdojo_id}`);
      }
    }
  } catch (error) {
    console.error(`Error processing student_event for ${student.contestdojo_id}:`, error);
  }
}

//processTeamsCSV()
processStudentsCSV()