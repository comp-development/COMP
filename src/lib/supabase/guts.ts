import { supabase } from "../supabaseClient";

export async function getGutsScores(test_id: number) {
    const { data, error } = await supabase
        .from("guts_scores")
        .select("*")
        //.eq("test_id", test_id);
        //.cache(false);
        
    if (error) throw error;
    console.log("DATA", data)
    return data;
}