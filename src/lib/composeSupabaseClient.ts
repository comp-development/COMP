import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_COMPOSE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_COMPOSE_ANON_KEY;

export const supabaseCompose = createClient(supabaseUrl, supabaseAnonKey);
