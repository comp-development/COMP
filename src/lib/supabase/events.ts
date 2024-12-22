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
        .eq("event_id", event_id)
		.order("test_name");
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

export async function getEventsbyStudentID(student_id: string, customSelect: string = "*") {
	const { data, error } = await supabase
		.from('student_events')
		.select(customSelect)
		.eq('student_id', student_id);
	if (error) throw error;
	return data;
}

export async function getStudentEvents(event_id: string, select = "*, students(*)") {
	//throw new Error("Invalidinvalid");
	const parsedEventId = parseInt(event_id, 10); // Parse event_id to integer
	//console.log(parsedEventId)
	if (isNaN(parsedEventId)) {
	  throw new Error("Invalid event_id: Must be a valid integer");
	}
  
	const { data, error } = await supabase
	  .from("student_events")
	  .select(select)
	  .eq("event_id", parsedEventId); // Use parsed integer
	if (error) {
		console.error(error);
	}
	return data
}

export async function getCustomFields(event_id: string, select = "*") {
	//throw new Error("Invalidinvalid");
	const parsedEventId = parseInt(event_id, 10); // Parse event_id to integer
	//console.log("PARSED,", parsedEventId);
	if (isNaN(parsedEventId)) {
	  throw new Error("Invalid event_id: Must be a valid integer");
	}
  
	const { data, error } = await supabase
	  .from("custom_fields")
	  .select(select)
	  .eq("event_id", parsedEventId); // Use parsed integer

	if (error) {
		console.error(error);
		
	}
	//console.log("datadata",data);
	return data
}