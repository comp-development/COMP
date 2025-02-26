import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { SUPABASE_SERVICE_KEY } from "$env/static/private";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Only for use in api routes.
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  SUPABASE_SERVICE_KEY,
);
