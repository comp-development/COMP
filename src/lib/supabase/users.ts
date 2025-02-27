import { getUserTypeDatabase } from ".";
import { supabase, type AsyncReturnType } from "../supabaseClient";

/**
 * Creates a COMPOSE account for the user
 *
 * @param email string
 * @param password string
 */
export async function createAccount(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  console.log("DATA", data);
  console.log("ERROR", error)
  if (error) throw error;
  return data.user;
}

/**
 * Change user's password if verified. Returns nothing.
 *
 * @param accessToken
 * @param password
 */
export async function updateUserAuth(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: password,
  });
  if (error) throw error;
}

/**
 * Signs into an existing COMPOSE account for the user
 *
 * @param email string
 * @param password string
 */
export async function signIntoAccount(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) throw error;
}

/**
 * Reset a user's password through email. Returns nothing.
 *
 * @param email
 */
export async function resetUserPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/password-reset",
  });
  if (error) throw error;
}

/**
 * Signs out user from their account in their browser
 */
export async function signOut() {
  let { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Returns current user's info
 *
 * @returns current user info
 */
export async function getThisUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function addStudent(user_id: string, data: any) {
  const { error } = await supabase.from("students").insert({
    student_id: user_id,
    first_name: data.first_name,
    last_name: data.last_name,
    grade: data.grade,
    email: data.email,
  });

  if (error) throw error;
}

export async function addCoach(user_id: string, data: any) {
  const { error } = await supabase.from("coaches").insert({
    coach_id: user_id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
  });

  if (error) throw error;
}

/**
 * Get user information
 *
 * @param user_id
 * @returns dictionary of user information
 */

export async function getUser(user_id: string) {
  console.log("GETTING USER")
  if (await isType("admin", user_id)) {
    console.log("ADMIN")
    return await getAdmin(user_id);
  } else if (await isType("coach", user_id)) {
    console.log("COACH")
    return await getCoach(user_id);
  } else {
    console.log("STUDENT")
    return await getStudent(user_id);
  }
  
}

export async function getAdmin(user_id: string) {
  let { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("admin_id", user_id)
    .single();
  if (error) throw error;
  data.userType = "admin";
  return data;
}

export type Student = AsyncReturnType<typeof getStudent>;

export async function getStudent(user_id: string) {
  let { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("student_id", user_id)
    .single();
  if (error) throw error;
  data.userType = "student";
  return data;
}

export async function getCoach(user_id: string) {
  let { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("coach_id", user_id)
    .single();
  if (error) throw error;
  data.userType = "coach";
  return data;
}

export async function getAllCoaches() {
  let { data, error } = await supabase.from("coaches").select("*");
  if (error) throw error;
  return data;
}

export async function getAllCoachesOutsideOrg(org_id: number) {
  const { data: existingCoaches, error: existingError } = await supabase
    .from("org_coaches")
    .select("coach_id")
    .eq("org_id", org_id);

  if (existingError) throw existingError;

  const excludedCoachIds = existingCoaches.map((coach) => coach.coach_id);

  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .not("coach_id", "in", `(${excludedCoachIds.join(",")})`);

  if (error) throw error;

  return data?.map((coach) => ({ person: coach })) || [];
}

/**
 * Check if user is a certain type
 *
 * @param type: string
 * @param user_id: string
 * @returns boolean if user is a certain type of user or not
 */
export async function isType(
  type: string = "admin",
  user_id: string | null = null,
) {
  console.log("IS TYPE", type, user_id)
  try {
    if (!user_id) {
      const user = await getThisUser();
      user_id = user?.id;
    }
    console.log(getUserTypeDatabase(type))
    const { data, error } = await supabase
      .from(getUserTypeDatabase(type))
      .select(type + "_id")
      .eq(type + "_id", user_id);
    console.log("DATA", data)
    if (error) return false;
    return data !== null && data.length > 0;
  } catch (e) {
    console.log(e)
    return false;
  }
}

/**
 * Get all admin users
 *
 * @param select string
 * @returns list of admin users
 */
export async function getAdminUsers(select: string = "*") {
  const { data, error } = await supabase.from("admins").select(select);
  if (error) throw error;
  return data;
}

export async function getallUsers() {
  let data = [];
  let users = await getAdminUsers();
  for (let user of users) {
    data.push({
      person: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
      role: "Admin",
      admin_id: user.admin_id,
    });
  }

  users = await getStudentUsers();
  for (let user of users) {
    data.push({
      person: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
      role: "Student",
      student_id: user.student_id,
    });
  }

  users = await getAllCoaches();
  for (let user of users) {
    data.push({
      person: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
      role: "Coach",
      coach_id: user.coach_id,
    });
  }

  return data;
}

/**
 * Get all student users
 *
 * @param select string
 * @returns list of student users
 */
export async function getStudentUsers(select: string = "*") {
  const { data, error } = await supabase.from("students").select(select);
  if (error) throw error;
  return data;
}

/**
 * Transfer user from student to admin or vise versa
 *
 * @param user_id string
 * @param from_type "admin" | "student" | "coach"
 * @param to_type "admin" | "student" | "coach"
 */
export async function transferUser(
  user_id: string,
  from_type: "admin" | "student" | "coach",
  to_type: "admin" | "student" | "coach",
) {
  // Get the database table names
  const fromDatabase = getUserTypeDatabase(from_type);
  const toDatabase = getUserTypeDatabase(to_type);

  // Get user data from current table
  const { data, error } = await supabase
    .from(fromDatabase)
    .select("*")
    .eq(`${from_type}_id`, user_id)
    .single();
  if (error) throw error;

  // Delete user from current table
  const { error: deleteError } = await supabase
    .from(fromDatabase)
    .delete()
    .eq(`${from_type}_id`, user_id);
  if (deleteError) throw deleteError;

  // Prepare data for new table
  const transferData = {
    [`${to_type}_id`]: user_id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
  };

  // If transferring to student table, include grade if it exists
  if (to_type === "student" && data.grade) {
    transferData.grade = data.grade;
  }

  // Insert user into new table
  const { error: insertError } = await supabase
    .from(toDatabase)
    .insert(transferData);
  if (insertError) throw insertError;
}

export async function editUser(
  user_id: string,
  userType: "admin" | "student" | "coach",
  user: any,
) {
  let database = getUserTypeDatabase(userType);

  const { userType: _, ...userDataToUpdate } = user;

  const { error } = await supabase
    .from(database)
    .update(userDataToUpdate)
    .eq(userType + "_id", user_id);

  if (error) throw error;
}
