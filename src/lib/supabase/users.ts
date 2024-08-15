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
		.from('admin')
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
		.from('admin')
		.select(select);
	if (error) throw error;
	return data;
}