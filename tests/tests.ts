import { adminSupabase, assert, assert_eq } from "./assert";

export default async function setup_test() {
  const test_student = await adminSupabase
    .from("students")
    .select("*")
    .eq("first_name", "Test")
    .eq("last_name", "Student")
    .single();

  const student = test_student.data;
  assert(student != null, "should have test student");
  const student_data = await adminSupabase.auth.admin.getUserById(
    student!.student_id,
  );
  assert_eq(student_data?.data?.user?.email, "student@gmail.com");
}
