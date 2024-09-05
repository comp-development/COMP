import { supabase } from "../supabaseClient";

export async function getAllEvents(select:string="*") {
    const { data, error } = await supabase
		.from('events')
		.select(select);
	if (error) throw error;
	return data;
}