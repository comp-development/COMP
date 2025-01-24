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
 * Get user information
 * 
 * @param user_id
 * @returns dictionary of user information
 */

export async function getUser(user_id: string) {
	if (await isType("admin", user_id)) {
		return (await getAdmin(user_id));
	} else if (await isType("coach", user_id)) {
		return (await getCoach(user_id));
	} else {
		return (await getStudent(user_id));
	}	
}

export async function getAdmin(user_id: string) {
	let { data, error } = await supabase
		.from('admins')
		.select('*')
		.eq('admin_id', user_id)
		.single();
	if (error) throw error;
	data.userType = "admin";
	return data;
}

export async function getStudent(user_id: string) {
	let { data, error } = await supabase
		.from('students')
		.select('*')
		.eq('student_id', user_id)
		.single();
	if (error) throw error;
	data.userType = "student";
	return data;
}

export async function getCoach(user_id: string) {
	let { data, error } = await supabase
		.from('coaches')
		.select('*')
		.eq('coach_id', user_id)
		.single();
	if (error) throw error;
	data.userType = "coach";
	return data;
}

/**
 * Check if user is a certain type
 * 
 * @param type: string
 * @param user_id: string
 * @returns boolean if user is a certain type of user or not
 */
export async function isType(type: string = "admin", user_id: string | null = null) {
	try {
		if (!user_id) {
			const user = await getThisUser();
			user_id = user?.id;
		}

		const { data, error } = await supabase
			.from(type === "coach" ? "coaches" : (type + "s"))
			.select(type + '_id')
			.eq(type + '_id', user_id);
			
		if (error) return false;
		return data !== null && data.length > 0;
	} catch (e) {
		return false;
	}
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
	//delete user from previous table
	const { data, error } = await supabase
		.from(to_admin ? "students" : "admins")
		.select('*')
  		.eq(to_admin ? "student_id" : "admin_id", user_id)
		.single();
	if (error) throw error;

	const { error2 } = await supabase
		.from(to_admin ? "students" : "admins")
		.delete()
  		.eq(to_admin ? "student_id" : "admin_id", user_id);
	if (error2) throw error2;

	//add user to new table
	const original_data = to_admin ? {"admin_id" : user_id} : {"student_id" : user_id};
	original_data.first_name = data.first_name; 
	original_data.last_name = data.last_name;

	const { data2, error3 } = await supabase
		.from(to_admin ? "admins" : "students")
		.insert(original_data);
	if (error3) throw error3;
}

export async function editUser(user_id: string, isUserAdmin: boolean, user: any) {
	let database = isUserAdmin ? "admin" : "student";

	const { error } = await supabase
		.from(database + "s")
		.update(user)
		.eq(database + "_id", user_id);

	if (error) throw error;
}