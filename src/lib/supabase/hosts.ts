import { supabase } from "../supabaseClient";

export async function getAllHosts(select: string = "*") {
    const { data, error } = await supabase.from("hosts").select(select);
    if (error) throw error;
    return data;
}

export async function getHostInformation(host_id: number, select: string = "*") {
    const { data, error } = await supabase.from("hosts")
        .select(select)
        .eq("host_id", host_id)
        .single();
    if (error) throw error;
    return data;
}