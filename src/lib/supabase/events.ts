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

export async function getEventTests(event_id:number, customSelect = "*") {
    let { data, error } = await supabase
        .from("tests")
        .select(customSelect)
        .eq("event_id", event_id);
    if (error) throw error;
    return data;
}

export async function getEventTeams(event_id:number) {
	const { data, error } = await supabase
		.from('teams')
		.select("*")
		.eq('event_id', event_id);
	if (error) throw error;
	return data;
}

export async function getStudentEvents(student_id: string, customSelect: string = "*") {
	const { data, error } = await supabase
		.from('student_events')
		.select(customSelect)
		.eq('student_id', student_id);
	if (error) throw error;
	return data;
}