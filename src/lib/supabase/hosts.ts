import { supabase } from "../supabaseClient";

export async function getAllHosts(select: string = "*") {
    const { data, error } = await supabase.from("hosts").select(select);
    if (error) throw error;
    return data;
}