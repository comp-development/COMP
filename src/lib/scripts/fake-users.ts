import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const event_id = 11; // USER INPUT;
const test_id = 30; // USER INPUT;
const student_nums= 1000; // USER INPUT;
const same_team = true; // USER INPUT;

async function createFakeUsers() {
  let perm_team_id : string | null = 1;
  for (let i = 1; i <= student_nums; i++) {
    const email = `student${i}@gmail.com`;
    const password = "student123";
    let userId: string | undefined;

    // Create user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true
      }
    );

    if (signUpError) {
      if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
        console.log(`User already exists: ${email}, trying to sign in...`);
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          console.error(`Failed to sign in ${email}:`, signInError.message);
          continue;
        }
        userId = signInData.user.id;
      } else {
        console.error(`Error signing up ${email}:`, signUpError.message);
        continue;
      }
    } else {
      console.log(`User signed up: ${email}`);
      userId = signUpData.user?.id;
    }
    console.log("USERID", userId);

    if (!userId) {
      console.error(`User ID not found for ${email}`);
      continue;
    }


    // create a fake student entry
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .insert({
        email: email,
        first_name: `student${i}`,
        last_name: `student${i}`,
        grade: 12,
        student_id: userId,
      });

    // create a fake ticker order for the user
    const { data: tickerOrder, error: tickerError } = await supabase.from("ticket_orders").insert({
      student_id: userId,
      event_id: event_id,
      quantity: 1,
      order_id: `test_for_student${i}`,
      ticket_service: "admin",
    });

    if (tickerError) {
      console.error("Error creating ticket order:", tickerError.message);
    }


    let teamId: string | null = null;

    if(!same_team) {
        const { data: team_id, error: teamError } = await supabase
        .from("teams")
        .insert({
            team_name: `Team student ${i} test`,
            event_id: event_id,
            join_code: `T-student${i}`,
        })
        .select("team_id") // specify the fields you want to return
        .single();

        // add all the students to a givent team!

        if(teamError) {
        console.log("Error creating team:");
        const { data: team_ids, error: teamError } = await supabase
        .from("teams")
        .select("team_id")
        .eq("team_name", `Team student ${i} test`)
        .eq("event_id", event_id)
        .single();
        if(teamError) {
            console.error("Error getting team:", teamError.message);
        }
        teamId = team_ids?.team_id;
        }
        else {
        teamId = team_id?.team_id;
        }
    }
    else if(same_team && i == 1) {
        // let first team try creating a team
        const { data: team_id, error: teamError } = await supabase
        .from("teams")
        .insert({
            team_name: `Team student ${i} test`,
            event_id: event_id,
            join_code: `T-student${i}`,
        })
        .select("team_id") // specify the fields you want to return
        .single();

        // add all the students to a givent team!

        if(teamError) {
        console.log("Error creating team:");
        const { data: team_ids, error: teamError } = await supabase
        .from("teams")
        .select("team_id")
        .eq("team_name", `Team student ${i} test`)
        .eq("event_id", event_id)
        .single();
        if(teamError) {
            console.error("Error getting team:", teamError.message);
        }
        teamId = team_ids?.team_id;
        }
        else {
        teamId = team_id?.team_id;
        }
        perm_team_id = teamId;
    }
    else {
        teamId = perm_team_id;
    }
    // create a team entry

    console.log("teamId", teamId);

    // create a student registratins team
    const { error } = await supabase.from("student_events").insert({
      student_id: userId,
      event_id: event_id,
      waiver: "random",
      team_id: teamId,
    });

    if (error) {
      // try putting all students on the same team
      console.error("Error creating student event:", error.message);
      await supabase.from("student_events")
      .update( {
        team_id: teamId
      })
      .eq("student_id", userId)
      .eq("event_id", event_id);
    }

    // create a test object for the test(if one does not exist, set expiration for 1 day from now)

    if(same_team) {
        if( i === 1)
        {
            const {data: testTakerData, error: testTakerError} =
            await supabase.from("test_takers").upsert({
             test_id: test_id,
             team_id: teamId,
            //  student_id: userId,
             start_time: new Date(Date.now()),
             end_time: new Date(Date.now() + 60 * 60 * 1000* 24).toISOString(),
             page_number: 1
           });
       
           if(testTakerError) {
             console.error("Error creating test taker:", testTakerError.message);
           }
        }
       
    }
    else {
        const {data: testTakerData, error: testTakerError} =
        await supabase.from("test_takers").upsert({
        test_id: test_id,
        //   team_id: teamId,
        student_id: userId,
        start_time: new Date(Date.now()),
        end_time: new Date(Date.now() + 60 * 60 * 1000* 24).toISOString(),
        page_number: 1
        });

        if(testTakerError) {
        console.error("Error creating test taker:", testTakerError.message);
        }
    }
    

    console.log(`Student ${i} test created`);



  }
}

createFakeUsers();
