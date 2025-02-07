import type { AsyncReturnType } from "$lib/supabaseClient";
import {
  adminSupabase,
  assert,
  assert_eq,
  unwrap,
  unwrap_data,
  unwrap_error,
} from "./assert";

export async function setup_test() {
  const test_student = unwrap_data(
    await adminSupabase
      .from("students")
      .select("*")
      .eq("first_name", "Test")
      .eq("last_name", "Student")
      .single(),
  );
  const student_data = await adminSupabase.auth.admin.getUserById(
    test_student!.student_id,
  );
  assert_eq(
    student_data?.data?.user?.email,
    "student@gmail.com",
    "mismatched name for seeded test student",
  );

  console.log("setup test passed");
  return test_student;
}

type Student = AsyncReturnType<typeof setup_test>;

export async function validate_student_team_constraints(student: Student) {
  const student_id = student.student_id;
  const new_host = unwrap_data(
    await adminSupabase
      .from("hosts")
      .insert([{ host_name: "Test Host" }])
      .select("*")
      .single(),
  );
  const new_event = unwrap_data(
    await adminSupabase
      .from("events")
      .insert([
        {
          event_name: "Test Event",
          host_id: new_host.host_id,
          ticket_price_cents: 1500,
        },
      ])
      .select("*")
      .single(),
  );
  const event_id = new_event.event_id;
  const new_team = unwrap_data(
    await adminSupabase
      .from("teams")
      .insert([{ event_id, team_name: "Test Team" }])
      .select("*")
      .single(),
  );
  const team_id = new_team.team_id;

  // Inserting just a student into student_events should succeed.
  unwrap(
    await adminSupabase
      .from("student_events")
      .insert([{ event_id, student_id, team_id: null }]),
  );
  // Putting the student onto a team without paying should fail.
  const error = unwrap_error(
    await adminSupabase
      .from("student_events")
      .update({ team_id })
      .eq("event_id", event_id)
      .eq("student_id", student_id)
      .select("*"),
  );
  assert_eq(error.message, "No matching team with the same org id");

  // TODO: check that inserting a student onto a team with a mismatched org is an error.
  // TODO: check that inserting a student onto a team with a mismatched org is an error.

  // TODO: check that inserting student onto team with paying is not error.

  console.log("validate student team constraints passed");
}
