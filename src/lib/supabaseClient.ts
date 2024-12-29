import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey!);
