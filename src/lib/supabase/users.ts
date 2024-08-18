import { supabase } from "../supabaseClient";

/**
 * Creates a COMPOSE account for the user
 *
 * @param email string
 * @param password string
 */
export async function createAccount(email: string, password: string) {
	const { user, session, error } = await supabase.auth.signUp({
		email: email,
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
		data: { user }
	} = await supabase.auth.getUser();
	return user;
}

/**
 * Check if user is an admin
 * 
 * @returns boolean if user is admin or not
 */
export async function isAdmin() {
	const user = await getThisUser();
	const { data, error } = await supabase
		.from('admins')
		.select('admin_id')
		.eq('admin_id', user.id)
		.single();
	if (error) throw error;
	return data !== null;
}

/**
 * Get all admin users
 * 
 * @param select string
 * @returns list of admin users
 */
export async function getAdminUsers(select:string="*") {
	const { data, error } = await supabase
		.from('admins')
		.select(select);
	if (error) throw error;
	return data;
}

/**
 * Get all student users
 * 
 * @param select string
 * @returns list of student users
 */
export async function getStudentUsers(select:string="*") {
	const { data, error } = await supabase
		.from('students')
		.select(select);
	if (error) throw error;
	return data;
}

/**
 * Transfer user from student to admin or vise versa
 * 
 * @param user_id string
 * @param to_admin boolean
 */
export async function transferUser(user_id: string, to_admin: boolean) {
	console.log(user_id);
	console.log(to_admin);

	//delete user from previous table
	const { data, error } = await supabase
		.from(to_admin ? "students" : "admin")
		.select('*')
  		.eq(to_admin ? "student_id" : "admin_id", user_id)
		.single();
	if (error) throw error;

	console.log(data);

	const { error2 } = await supabase
		.from(to_admin ? "students" : "admin")
		.delete()
  		.eq(to_admin ? "student_id" : "admin_id", user_id);
	if (error2) throw error2;

	//add user to new table
	const original_data = to_admin ? {"admin_id" : user_id} : {"student_id" : user_id};
	original_data.first_name = data.first_name; 
	original_data.last_name = data.last_name;

	const { data2, error3 } = await supabase
		.from(to_admin ? "admin" : "students")
		.insert(original_data);
	if (error3) throw error3;
	
	console.log(data2);
}