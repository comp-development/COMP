import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// See https://github.com/orgs/supabase/discussions/21838.
export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;

// Extracts the field `Key` of T | null if T is not null.
export type Get<T, Key extends keyof NonNullable<T>> = T extends NonNullable<T>
  ? T[Key]
  : null;

// Get parent directory path (we are in subdir `tests`)
const COMP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)) + "/..",
);

export const adminSupabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey!,
);

export function assert(
  condition: boolean,
  msg: string = "",
  level: number = 1,
) {
  if (!condition) {
    const err = new Error();
    // Go up the call stack by 1 + level (in case we are in nested asserts).
    const caller_line = err.stack!.split("\n")[1 + level];
    const index = caller_line.indexOf("at ");
    const clean_line = caller_line
      .slice(index + "at ".length, caller_line.length)
      .replaceAll(COMP_DIR, "");

    if (msg.length > 0) {
      msg = ": " + msg;
    }
    console.error(`Assert failed at ${clean_line}${msg}`);
    process.exit();
  }
}

export function assert_eq<T>(a: T, b: T, msg: string = "", level: number = 1) {
  const a_json = JSON.stringify(a);
  const b_json = JSON.stringify(b);
  const limit = 80;
  let a_trimmed =
    a_json.length > limit ? a_json.substring(0, limit) + " ..." : a_json;
  let b_trimmed =
    b_json.length > limit ? b_json.substring(0, limit) + " ..." : b_json;
  assert(
    a_json == b_json,
    `\n\t${a_trimmed} and ${b_trimmed} are not equal. \n\t` + msg,
    level + 1,
  );
}

type Diff<T, S> = T extends S ? never : T;
type UnwrapData<T> = T extends { data: infer T | null } ? T : never;
type UnwrapError<T> = T extends { error: infer T | null } ? T : never;

// Unwrap a data value
export function unwrap_data<
  T,
  E,
  R extends { data: T | null; error: E | null },
>(result: R): Diff<UnwrapData<R>, null | undefined> {
  assert_eq(result.error, null, "Expected error to be null", 2);
  assert(result.data != null, "Expected data to be non-null", 2);
  assert(result.data != undefined, "Expected data to be non-undefined", 2);
  return result.data as Diff<UnwrapData<R>, null | undefined>;
}

export function unwrap<E, R extends { error: E | null }>(result: R) {
  assert_eq(result.error, null, "Expected error to be null", 2);
  return;
}

// Unwrap an error value.
export function unwrap_error<E, R extends { error: E | null }>(
  result: R,
): Diff<UnwrapError<R>, null | undefined> {
  assert(result.error != null, "Expected error to be non-null", 2);
  return result.error as Diff<UnwrapError<R>, undefined | null>;
}
