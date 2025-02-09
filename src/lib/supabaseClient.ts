import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Unpacked<T> = T extends (infer U)[] ? U : T;
// See https://github.com/orgs/supabase/discussions/21838.
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

// Extracts the field `Key` of T | null if T is not null.
export type Get<T, Key extends keyof NonNullable<T>> = T extends NonNullable<T>
  ? T[Key]
  : null;
