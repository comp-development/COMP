import { supabase } from "../supabaseClient";

export async function getAllEvents(select:string="*") {
    const { data, error } = await supabase
		.from('events')
		.select(select);
	if (error) throw error;
	return data;
}

export async function getEventInformation(event_id:number, select:string="*") {
	const { data, error } = await supabase
		.from('events')
		.select(select)
		.eq("event_id", event_id)
		.single();
	if (error) throw error;
	return data;
}