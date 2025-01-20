import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Only for use in api routes.
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey!,
);
