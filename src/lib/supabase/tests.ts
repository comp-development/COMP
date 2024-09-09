import { supabase } from "../supabaseClient";

export async function getEventTests(event_id:number) {
    const { data, error } = await supabase
		.from('tests')
		.select("*")
        .eq('event_id', event_id);
	if (error) throw error;
	return data;
}