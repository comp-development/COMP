



import { parse } from 'csv-parse/sync';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../../.env") });



const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);


const table = 'teams';
const table_id = 'team_id';
const event_id = 10;
const updateFrontId = true;
const updateWaiver = false;

export async function updateStudentEventsFromCSV(csvFilePath) {
  try {
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Process each record
    for (const record of records) {
        const updateDict = {};
        if (updateFrontId) {
            updateDict.front_id = record.front_id;
        }
        if (updateWaiver) {
            updateDict.waiver = record.waiver;
        }
        
      // Update the student_events table
      const { error } = await supabase
        .from(table)
        .update(updateDict)
        .eq(table_id, record[table_id])
        .eq('event_id', event_id);

      if (error) {
        console.error(`Error updating record for ${table_id} ${record[table_id]} and event_id ${event_id}:`, error);
      } else {
        console.log(`Updated record for ${table_id} ${record[table_id]} and event_id ${event_id}`);
      }
    }

    console.log('Student events update completed');
  } catch (error) {
    console.error('Error processing CSV file:', error);
    throw error;
  }
}

// Command line interface
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const csvFilePath = process.argv[2];
  if (!csvFilePath) {
    console.error('Please provide the path to the CSV file as an argument');
    process.exit(1);
  }
  
  updateStudentEventsFromCSV(csvFilePath)
    .then(() => {
      console.log('Update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
} 