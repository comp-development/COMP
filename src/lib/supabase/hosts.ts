import { supabase } from "../supabaseClient";

export async function getAllHosts(select: string = "*") {
    const { data, error } = await supabase.from("hosts").select(select);
    if (error) throw error;
    return data;
}

export async function getAllPublicHosts(select: string = "*") {
    const { data, error } = await supabase
        .from("hosts")
        .select(`${select}, events!inner(*)`)
        .eq('events.published', true);
    
    if (error) throw error;

    const uniqueHosts = [...new Map(data.map(host => [host.host_id, host])).values()];
    console.log("UNIQUE HOSTS", uniqueHosts)
    return uniqueHosts;
}

export async function getHostInformation(host_id: number, select: string = "*") {
    const { data, error } = await supabase.from("hosts")
        .select(select)
        .eq("host_id", host_id)
        .single();
    if (error) throw error;
    return data;
}