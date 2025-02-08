import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

// Only for use in api routes.
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey!,
);
