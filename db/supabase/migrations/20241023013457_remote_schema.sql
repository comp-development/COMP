

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."add_test_taker_result" AS (
	"success" boolean,
	"message" "text",
	"test_taker_id" bigint
);


ALTER TYPE "public"."add_test_taker_result" OWNER TO "postgres";


CREATE TYPE "public"."answer_type" AS ENUM (
    'AsciiMath',
    'Text',
    'Integer',
    'Decimal'
);


ALTER TYPE "public"."answer_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."answer_type" IS 'What the answer type can be';



CREATE TYPE "public"."test_mode" AS ENUM (
    'Standard',
    'Puzzle',
    'Guts',
    'Meltdown'
);


ALTER TYPE "public"."test_mode" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_test_taker"("p_test_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
    v_is_team boolean;
    v_test_opening_time timestamptz;
    v_test_length interval;
    v_test_buffer_time interval;
    v_test_end_time timestamptz;
    v_user_id uuid := auth.uid()::uuid;  -- Cast auth.uid() to uuid
    v_team_id bigint;
    v_student_id bigint;
    v_current_time timestamptz := now();
begin
    -- Retrieve test details: is_team, opening_time, length, buffer_time
    select t.is_team, t.opening_time, t.length * interval '1 second', t.buffer_time * interval '1 second'
    into v_is_team, v_test_opening_time, v_test_length, v_test_buffer_time
    from tests t
    where t.test_id = p_test_id;

    -- Calculate the test end time
    v_test_end_time := v_test_opening_time + v_test_length + v_test_buffer_time;

    -- Debug output
    raise notice 'Test Details - is_team: %, opening_time: %, length: %, buffer_time: %, end_time: %',
                 v_is_team, v_test_opening_time, v_test_length, v_test_buffer_time, v_test_end_time;

    -- Check if the test is currently open
    if v_test_opening_time is null or v_current_time < v_test_opening_time or v_current_time > v_test_end_time then
        raise exception 'The test is not currently open.';
        return;
    end if;

    -- Debug output
    raise notice 'Current Time: %', v_current_time;

    -- Check if a test_taker for this user and test already exists
    if v_is_team then
        select team_id
        into v_team_id
        from student_events
        where student_id = v_user_id;

        -- Debug output
        raise notice 'Team ID: %', v_team_id;

        if exists (select 1
                   from test_takers
                   where test_id = p_test_id
                     and team_id = v_team_id) then
            raise exception 'A test taker entry for this team already exists.';
            return;
        end if;

    else
        if exists (select 1
                   from test_takers
                   where test_id = p_test_id
                     and student_id = v_user_id) then
            raise exception 'A test taker entry for this student already exists.';
            return;
        end if;

    end if;

    -- Check if the user/team can start the test
    if not check_test_division_access(p_test_id) then
        raise exception 'The user/team does not have access to this test.';
        return;
    end if;

    -- Insert a new row in the test_takers table
    insert into test_takers (test_id, student_id, team_id, start_time, end_time)
    values (
        p_test_id,
        case when v_is_team then null else v_user_id end,
        case when v_is_team then v_team_id else null end,
        v_current_time,
        least(v_current_time + v_test_length, v_test_end_time)
    );

    -- Debug output
    raise notice 'Inserted test_taker - test_id: %, student_id: %, team_id: %, start_time: %, end_time: %',
                 p_test_id, 
                 case when v_is_team then null else v_user_id end,
                 case when v_is_team then v_team_id else null end,
                 v_current_time,
                 least(v_current_time + v_test_length, v_test_end_time);
end;$$;


ALTER FUNCTION "public"."add_test_taker"("p_test_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_test_taker_2"("p_test_id" bigint) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    v_is_team boolean;
    v_test_opening_time timestamptz;
    v_test_length interval;
    v_test_buffer_time interval;
    v_test_end_time timestamptz;
    v_user_id uuid := auth.uid()::uuid;  -- Cast auth.uid() to uuid
    v_team_id bigint;
    v_student_id bigint;
    v_current_time timestamptz := now();
begin
    -- Retrieve test details: is_team, opening_time, length, buffer_time
    select t.is_team, t.opening_time, t.length * interval '1 second', t.buffer_time * interval '1 second'
    into v_is_team, v_test_opening_time, v_test_length, v_test_buffer_time
    from tests t
    where t.test_id = p_test_id;

    -- Calculate the test end time
    v_test_end_time := v_test_opening_time + v_test_length + v_test_buffer_time;

    -- Debug output
    raise notice 'Test Details - is_team: %, opening_time: %, length: %, buffer_time: %, end_time: %',
                 v_is_team, v_test_opening_time, v_test_length, v_test_buffer_time, v_test_end_time;

    -- Check if the test is currently open
    if v_test_opening_time is null or v_current_time < v_test_opening_time or v_current_time > v_test_end_time then
        return 'The test is not currently open.';
    end if;

    -- Debug output
    raise notice 'Current Time: %', v_current_time;

    -- Check if a test_taker for this user and test already exists
    if v_is_team then
        select team_id
        into v_team_id
        from student_events
        where student_id = v_user_id;

        -- Debug output
        raise notice 'Team ID: %', v_team_id;

        if exists (select 1
                   from test_takers
                   where test_id = p_test_id
                     and team_id = v_team_id) then
            return 'A test taker entry for this taker already exists.';
        end if;

    else
        if exists (select 1
                   from test_takers
                   where test_id = p_test_id
                     and student_id = v_user_id) then
            return 'A test taker entry for this taker already exists.';
        end if;

    end if;

    -- Check if the user/team can start the test
    if not check_test_division_access(p_test_id) then
        return 'The user/team does not have access to this test.';
    end if;

    -- Insert a new row in the test_takers table
    insert into test_takers (test_id, student_id, team_id, start_time, end_time)
    values (
        p_test_id,
        case when v_is_team then null else v_user_id end,
        case when v_is_team then v_team_id else null end,
        v_current_time,
        least(v_current_time + v_test_length, v_test_end_time)
    );

    return 'Inserted test_taker';

    -- Debug output
    raise notice 'Inserted test_taker - test_id: %, student_id: %, team_id: %, start_time: %, end_time: %',
                 p_test_id, 
                 case when v_is_team then null else v_user_id end,
                 case when v_is_team then v_team_id else null end,
                 v_current_time,
                 least(v_current_time + v_test_length, v_test_end_time);
end;
$$;


ALTER FUNCTION "public"."add_test_taker_2"("p_test_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."change_page"("p_test_taker_id" bigint, "p_page_number" integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
    starttime_res timestamptz;
    endtime_res timestamptz;
    current_page_number integer;
begin
    -- Check if the user is authorized to make the change
    if not verify_test_access(p_test_taker_id, auth.uid()) then
        return 'Authorization failed';
    end if;

    -- Fetch page_number
    select page_number
    into current_page_number
    from test_takers
    where test_taker_id = p_test_taker_id;

    -- Page number logic
    if p_page_number = current_page_number then
        return 'Same page requested';
    elsif p_page_number < current_page_number then
        return 'Current page requested';
    elsif p_page_number > current_page_number + 1 then
        return 'Future page requested';
    end if;

    -- If all checks pass, update the page_number
    update test_takers
    set page_number = p_page_number
    where test_taker_id = p_test_taker_id;

    return 'Page changed successfully';
end;$$;


ALTER FUNCTION "public"."change_page"("p_test_taker_id" bigint, "p_page_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_teammate"("p_student_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    v_auth_uid uuid := auth.uid()::uuid;  -- Current user's ID
begin
    -- Check if there is at least one overlapping team_id
    return exists (
        select 1
        from student_events se1
        join student_events se2
        on se1.team_id = se2.team_id
        where se1.student_id = v_auth_uid
        and se2.student_id = p_student_id
    );
end;
$$;


ALTER FUNCTION "public"."check_teammate"("p_student_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_test_division_access"("p_test_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
    v_is_team boolean;
    v_test_visible boolean;
    v_test_division text;
    v_event_id bigint;
    v_user_event_id bigint;
    v_user_division text;
    v_team_division text;
    v_auth_uid uuid := auth.uid()::uuid;  -- Cast auth.uid() to uuid
begin
    -- Retrieve test details: is_team, division, and event_id
    select t.is_team, t.division, t.event_id, t.visible 
    into v_is_team, v_test_division, v_event_id, v_test_visible
    from tests t
    where t.test_id = p_test_id;

    -- Verify that the user is associated with the test’s event
    if v_is_team then
        -- Get the user's team's event_id and division
        select se.event_id, tm.division
        into v_user_event_id, v_team_division
        from student_events se
        join teams tm on se.team_id = tm.team_id
        where se.student_id = v_auth_uid;

        -- Ensure the team’s event_id matches the test’s event_id
        if v_user_event_id != v_event_id then
            return false;
        end if;

        v_user_division := v_team_division;

    else
        -- Get the user's event_id and division
        select se.event_id, se.division
        into v_user_event_id, v_user_division
        from student_events se
        where se.student_id = v_auth_uid;

        -- Ensure the student's event_id matches the test’s event_id
        if v_user_event_id != v_event_id then
            return false;
        end if;
    end if;

    if v_test_visible is not true then 
        return false;
    end if;

    -- Check if the division is required and matches
    if v_test_division is not null and v_test_division != '' then
        return v_user_division = v_test_division;
    end if;

    return true;
end;$$;


ALTER FUNCTION "public"."check_test_division_access"("p_test_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_test_problems"("p_test_taker_id" bigint) RETURNS SETOF "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
    v_test_id bigint;
    v_page_number int;
    v_auth_uid uuid := auth.uid();  -- Current user's ID, of type UUID
begin
    -- Step 1: Verify user has access to the test
    if not verify_test_access(p_test_taker_id, v_auth_uid) then
        return;
    end if;

    -- Step 2: Retrieve the test_id and page_number for the test_taker
    select test_id, page_number
    into v_test_id, v_page_number
    from test_takers
    where test_taker_id = p_test_taker_id;

    -- Step 3: Return test_problems as JSONB with problem_details nested inside
    return query
    select 
        jsonb_set(  -- Embed problem_details into the test_problems JSON
            row_to_json(tp.*)::jsonb, 
            '{problems}', 
            row_to_json(p.*)::jsonb
        ) as test_problems_record
    from test_problems tp
    join problems p on tp.problem_id = p.problem_id
    where tp.test_id = v_test_id
      and tp.page_number = v_page_number
    order by tp.problem_number;
end;$$;


ALTER FUNCTION "public"."fetch_test_problems"("p_test_taker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_test_answer"("p_test_taker_id" bigint, "p_test_problem_id" bigint, "p_answer" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
    starttime_res timestamptz;
    endtime_res timestamptz;
    upsert_result integer;
    test_taker_page integer;
    test_problem_page integer;
    melt_time integer;  -- meltTime in seconds
    problem_number integer;
    test_melt_time interval;
begin
    -- Check if the user is authorized to make the change
    if not verify_auth(p_test_taker_id, auth.uid()) then
        return 'Authorization failed';
    end if;

    -- Fetch start_time, end_time, page_number of test_taker, and melt_time (in seconds) of the associated test
    select tt.start_time, tt.end_time, tt.page_number, (t.settings->>'meltTime')::integer
    into starttime_res, endtime_res, test_taker_page, melt_time
    from test_takers tt
    join tests t on tt.test_id = t.test_id
    where tt.test_taker_id = p_test_taker_id;

    -- Check if start_time is before NOW()
    if starttime_res > NOW() then
        return 'Test has not started yet';
    end if;

    -- Allow upsert if within 5 seconds after end_time
    if NOW() > endtime_res + interval '5 seconds' then
        return 'End time has passed';
    end if;

    -- Fetch page_number and problem_number of the test_problem
    select tp.page_number, tp.problem_number
    into test_problem_page, problem_number
    from test_problems tp
    where tp.test_problem_id = p_test_problem_id;

    -- Check if the test_taker's page_number matches the test_problem's page_number
    if test_taker_page != test_problem_page then
        return 'Page number mismatch';
    end if;

    -- Check if meltTime is set and ensure the current time is within meltTime * problem_number after start_time
    if melt_time is not null then
        -- Convert melt_time to an interval and multiply by problem_number
        test_melt_time := (melt_time * problem_number) * interval '1 second';
        if NOW() > starttime_res + test_melt_time + interval '5 seconds' then
            return 'Problem is locked due to meltTime';
        end if;
    end if;

    -- Upsert: If the row exists, update it; otherwise, insert it
    with upsert as (
        insert into test_answers (test_taker_id, test_problem_id, answer_latex)
        values (p_test_taker_id, p_test_problem_id, p_answer)
        on conflict (test_taker_id, test_problem_id)
        do update set answer_latex = excluded.answer_latex
        returning 1 as result
    )
    select count(*) into upsert_result from upsert;

    -- Return success or failure message
    if upsert_result > 0 then
        return 'Upsert succeeded';
    else
        return 'Upsert failed';
    end if;
end;$$;


ALTER FUNCTION "public"."upsert_test_answer"("p_test_taker_id" bigint, "p_test_problem_id" bigint, "p_answer" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_auth"("tt_id" bigint, "stud_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$declare
        stud_res uuid;
        team_res bigint;
        num_res bigint;
    begin

        if stud_id is null then
            return false;  -- or handle it as needed
        end if;

        select student_id, team_id
        into stud_res, team_res
        from test_takers
        where test_taker_id = tt_id;
        
        if stud_res is null then
            select count(*)
            into num_res
            from student_events
            where student_id = stud_id and team_id = team_res;

            return (num_res >= 1);
        else
            return (stud_res = stud_id);
        end if;
    end;$$;


ALTER FUNCTION "public"."verify_auth"("tt_id" bigint, "stud_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_test_access"("p_test_taker_id" bigint, "p_student_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    stud_res boolean;
    starttime_res timestamp;
    endtime_res timestamp;
begin
    -- Call the 'verify_auth' function to check if the student is allowed access
    stud_res := verify_auth(p_test_taker_id, p_student_id);

    -- If 'verify_auth' fails, return false
    if not stud_res then
        return false;
    end if;

    -- Fetch start_time and end_time
    select start_time, end_time
    into starttime_res, endtime_res
    from test_takers
    where test_taker_id = p_test_taker_id;

    -- Check if the test has not started yet
    if starttime_res > NOW() then
        return false;
    end if;

    -- Check if the test has ended (allowing a 5-second grace period)
    if NOW() > endtime_res + interval '5 seconds' then
        return false;
    end if;

    -- If all checks pass, return true
    return true;
end;
$$;


ALTER FUNCTION "public"."verify_test_access"("p_test_taker_id" bigint, "p_student_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "admin_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text"
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "event_id" bigint NOT NULL,
    "event_name" "text",
    "event_date" "date",
    "published" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


ALTER TABLE "public"."events" ALTER COLUMN "event_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."events_event_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."graded_answers" (
    "graded_answer_id" bigint NOT NULL,
    "problem_id" bigint NOT NULL,
    "correct" boolean,
    "answer_latex" "text"
);

ALTER TABLE ONLY "public"."graded_answers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."graded_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_answers" (
    "test_answer_id" bigint NOT NULL,
    "test_taker_id" bigint NOT NULL,
    "test_problem_id" bigint NOT NULL,
    "answer_latex" "text",
    "last_edited_time" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text")
);

ALTER TABLE ONLY "public"."test_answers" REPLICA IDENTITY FULL;


ALTER TABLE "public"."test_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."test_problems" (
    "test_problem_id" bigint NOT NULL,
    "problem_id" bigint NOT NULL,
    "test_id" bigint NOT NULL,
    "problem_number" bigint NOT NULL,
    "page_number" bigint DEFAULT '1'::bigint NOT NULL,
    "points" double precision,
    "name" "text"
);


ALTER TABLE "public"."test_problems" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."graded_answer_count" WITH ("security_invoker"='true') AS
 SELECT "ta"."test_problem_id",
    "tp"."problem_id",
    "ta"."answer_latex",
    "ga"."graded_answer_id",
    "ga"."correct",
    "count"("ta"."test_answer_id") AS "count"
   FROM (("public"."test_answers" "ta"
     JOIN "public"."test_problems" "tp" ON (("ta"."test_problem_id" = "tp"."test_problem_id")))
     LEFT JOIN "public"."graded_answers" "ga" ON ((("tp"."problem_id" = "ga"."problem_id") AND ("ta"."answer_latex" = "ga"."answer_latex"))))
  GROUP BY "ta"."test_problem_id", "tp"."problem_id", "ta"."answer_latex", "ga"."graded_answer_id", "ga"."correct";


ALTER TABLE "public"."graded_answer_count" OWNER TO "postgres";


ALTER TABLE "public"."graded_answers" ALTER COLUMN "graded_answer_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."graded_answers_graded_answer_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."graded_answers" ALTER COLUMN "problem_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."graded_answers_problem_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."test_takers" (
    "test_taker_id" bigint NOT NULL,
    "student_id" "uuid",
    "team_id" bigint,
    "test_id" bigint NOT NULL,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "page_number" bigint DEFAULT '1'::bigint NOT NULL,
    CONSTRAINT "one_null" CHECK (((("student_id" IS NULL) AND ("team_id" IS NOT NULL)) OR (("student_id" IS NOT NULL) AND ("team_id" IS NULL))))
);


ALTER TABLE "public"."test_takers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tests" (
    "test_id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "test_name" "text",
    "buffer_time" integer DEFAULT 300,
    "instructions" "text",
    "opening_time" timestamp with time zone,
    "division" "text",
    "settings" "jsonb" DEFAULT '{"pages": [""]}'::"jsonb",
    "length" bigint DEFAULT '3600'::bigint NOT NULL,
    "is_team" boolean DEFAULT false NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "release_results" boolean DEFAULT false NOT NULL,
    "test_mode" "public"."test_mode" DEFAULT 'Meltdown'::"public"."test_mode" NOT NULL
);


ALTER TABLE "public"."tests" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tests"."length" IS 'in seconds';



CREATE OR REPLACE VIEW "public"."graded_test_answers" WITH ("security_invoker"='true') AS
 SELECT "ta"."test_answer_id",
    "ta"."test_taker_id",
    "ta"."test_problem_id",
    "ta"."answer_latex",
    "ga"."correct",
    "tp"."problem_number" AS "test_problem_number",
    "te"."test_name",
    "te"."test_id",
    "tp"."page_number" AS "test_problem_page",
        CASE
            WHEN ("ga"."correct" = true) THEN "tp"."points"
            ELSE ((0)::bigint)::double precision
        END AS "points",
    "ta"."last_edited_time"
   FROM (((("public"."test_answers" "ta"
     JOIN "public"."test_problems" "tp" ON (("ta"."test_problem_id" = "tp"."test_problem_id")))
     LEFT JOIN "public"."graded_answers" "ga" ON ((("tp"."problem_id" = "ga"."problem_id") AND ("ta"."answer_latex" = "ga"."answer_latex"))))
     JOIN "public"."test_takers" "tt" ON (("ta"."test_taker_id" = "tt"."test_taker_id")))
     LEFT JOIN "public"."tests" "te" ON (("tt"."test_id" = "te"."test_id")));


ALTER TABLE "public"."graded_test_answers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."guts_tests" AS
 SELECT "t"."test_id",
    "t"."event_id",
    "t"."test_name",
    "t"."buffer_time",
    "t"."instructions",
    "t"."opening_time",
    "t"."division",
    "t"."settings",
    "t"."length",
    "t"."is_team",
    "t"."visible" AS "visble",
    "t"."release_results",
    "t"."test_mode",
    "e"."event_name"
   FROM ("public"."tests" "t"
     JOIN "public"."events" "e" ON (("t"."event_id" = "e"."event_id")))
  WHERE ("t"."test_mode" = 'Guts'::"public"."test_mode");


ALTER TABLE "public"."guts_tests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."problem_clarifications" (
    "clarification_id" bigint NOT NULL,
    "test_problem_id" bigint NOT NULL,
    "clarification_latex" "text"
);


ALTER TABLE "public"."problem_clarifications" OWNER TO "postgres";


ALTER TABLE "public"."problem_clarifications" ALTER COLUMN "clarification_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."problem_clarifications_clarification_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."problems" (
    "problem_id" bigint NOT NULL,
    "problem_latex" "text" NOT NULL,
    "answer_latex" "text",
    "solution_latex" "text",
    "answer_type" "public"."answer_type" DEFAULT 'AsciiMath'::"public"."answer_type" NOT NULL
);


ALTER TABLE "public"."problems" OWNER TO "postgres";


ALTER TABLE "public"."problems" ALTER COLUMN "problem_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."problems_problem_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."student_events" (
    "relation_id" bigint NOT NULL,
    "student_id" "uuid" NOT NULL,
    "team_id" bigint,
    "front_id" "text",
    "event_id" bigint,
    "division" "text"
);


ALTER TABLE "public"."student_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "student_id" "uuid" NOT NULL,
    "contestdojo_id" "text",
    "first_name" "text",
    "last_name" "text",
    "grade" "text",
    "email" "text",
    "last_log_in" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."student_events_detailed" AS
 SELECT "se"."relation_id",
    "se"."student_id",
    "se"."team_id",
    "se"."front_id",
    "se"."event_id",
    "se"."division",
    "s"."first_name",
    "s"."last_name",
    "s"."email"
   FROM ("public"."student_events" "se"
     JOIN "public"."students" "s" ON (("se"."student_id" = "s"."student_id")));


ALTER TABLE "public"."student_events_detailed" OWNER TO "postgres";


ALTER TABLE "public"."student_events" ALTER COLUMN "relation_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."student_events_relation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "team_id" bigint NOT NULL,
    "team_name" "text",
    "event_id" bigint NOT NULL,
    "division" "text",
    "front_id" "text",
    "contestdojo_id" "text"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE "public"."teams" ALTER COLUMN "team_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."teams_team_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."test_answers" ALTER COLUMN "test_answer_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."test_answers_relation_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."test_problems" ALTER COLUMN "test_problem_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."test_problems_test_problem_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."test_takers_detailed" WITH ("security_invoker"='true') AS
 SELECT "tt"."test_taker_id",
    "tt"."student_id",
    "tt"."team_id",
    "tt"."test_id",
    "tt"."start_time",
    "tt"."end_time",
    "tt"."page_number",
        CASE
            WHEN ("tt"."student_id" IS NOT NULL) THEN "concat"("s"."first_name", ' ', "s"."last_name")
            WHEN ("tt"."team_id" IS NOT NULL) THEN "t"."team_name"
            ELSE 'Unknown'::"text"
        END AS "taker_name",
        CASE
            WHEN ("tt"."team_id" IS NOT NULL) THEN "t"."front_id"
            WHEN ("tt"."student_id" IS NOT NULL) THEN "se"."front_id"
            ELSE NULL::"text"
        END AS "front_id",
    "te"."test_name",
    "te"."division",
    "e"."event_name"
   FROM ((((("public"."test_takers" "tt"
     LEFT JOIN "public"."students" "s" ON (("tt"."student_id" = "s"."student_id")))
     LEFT JOIN "public"."teams" "t" ON (("tt"."team_id" = "t"."team_id")))
     LEFT JOIN "public"."tests" "te" ON (("tt"."test_id" = "te"."test_id")))
     LEFT JOIN "public"."events" "e" ON (("te"."event_id" = "e"."event_id")))
     LEFT JOIN "public"."student_events" "se" ON ((("te"."event_id" = "se"."event_id") AND ("s"."student_id" = "se"."student_id"))));


ALTER TABLE "public"."test_takers_detailed" OWNER TO "postgres";


ALTER TABLE "public"."test_takers" ALTER COLUMN "test_taker_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."test_takers_test_taker_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."tests_detailed" WITH ("security_invoker"='true') AS
 SELECT "te"."test_id",
    "te"."event_id",
    "te"."test_name",
    "te"."buffer_time",
    "te"."instructions",
    "te"."opening_time",
    "te"."division",
    "te"."settings",
    "te"."length",
    "te"."is_team",
    "te"."visible",
    "te"."release_results",
    "te"."test_mode",
    COALESCE("tp"."num_problems", (0)::bigint) AS "num_problems",
    "jsonb_array_length"(("te"."settings" -> 'pages'::"text")) AS "num_pages",
    "e"."event_name"
   FROM (("public"."tests" "te"
     LEFT JOIN ( SELECT "tp_1"."test_id",
            "count"("tp_1"."test_problem_id") AS "num_problems"
           FROM "public"."test_problems" "tp_1"
          GROUP BY "tp_1"."test_id") "tp" ON (("te"."test_id" = "tp"."test_id")))
     LEFT JOIN "public"."events" "e" ON (("te"."event_id" = "e"."event_id")));


ALTER TABLE "public"."tests_detailed" OWNER TO "postgres";


ALTER TABLE "public"."tests" ALTER COLUMN "test_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tests_test_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."graded_answers"
    ADD CONSTRAINT "graded_answers_pkey" PRIMARY KEY ("graded_answer_id");



ALTER TABLE ONLY "public"."graded_answers"
    ADD CONSTRAINT "no_duplicate_graded_answers" UNIQUE ("problem_id", "answer_latex");



ALTER TABLE ONLY "public"."problem_clarifications"
    ADD CONSTRAINT "problem_clarifications_pkey" PRIMARY KEY ("clarification_id");



ALTER TABLE ONLY "public"."problems"
    ADD CONSTRAINT "problems_pkey" PRIMARY KEY ("problem_id");



ALTER TABLE ONLY "public"."student_events"
    ADD CONSTRAINT "student_events_pkey" PRIMARY KEY ("relation_id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("student_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("team_id");



ALTER TABLE ONLY "public"."test_answers"
    ADD CONSTRAINT "test_answers_pkey" PRIMARY KEY ("test_answer_id");



ALTER TABLE ONLY "public"."test_problems"
    ADD CONSTRAINT "test_problems_pkey" PRIMARY KEY ("test_problem_id");



ALTER TABLE ONLY "public"."test_takers"
    ADD CONSTRAINT "test_takers_pkey" PRIMARY KEY ("test_taker_id");



ALTER TABLE ONLY "public"."tests"
    ADD CONSTRAINT "tests_pkey" PRIMARY KEY ("test_id");



ALTER TABLE ONLY "public"."test_answers"
    ADD CONSTRAINT "unique_test_taker_problem" UNIQUE ("test_taker_id", "test_problem_id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."graded_answers"
    ADD CONSTRAINT "graded_answers_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("problem_id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."problem_clarifications"
    ADD CONSTRAINT "problem_clarifications_test_problem_id_fkey" FOREIGN KEY ("test_problem_id") REFERENCES "public"."test_problems"("test_problem_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_events"
    ADD CONSTRAINT "student_events_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_events"
    ADD CONSTRAINT "student_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("team_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_events"
    ADD CONSTRAINT "student_teams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_answers"
    ADD CONSTRAINT "test_answers_test_problem_id_fkey" FOREIGN KEY ("test_problem_id") REFERENCES "public"."test_problems"("test_problem_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_answers"
    ADD CONSTRAINT "test_answers_test_taker_id_fkey" FOREIGN KEY ("test_taker_id") REFERENCES "public"."test_takers"("test_taker_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_problems"
    ADD CONSTRAINT "test_problems_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("problem_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_problems"
    ADD CONSTRAINT "test_problems_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("test_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_takers"
    ADD CONSTRAINT "test_takers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_takers"
    ADD CONSTRAINT "test_takers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("team_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."test_takers"
    ADD CONSTRAINT "test_takers_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("test_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tests"
    ADD CONSTRAINT "tests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete items" ON "public"."admins" FOR DELETE USING ((( SELECT "count"("admins_1"."admin_id") AS "count"
   FROM "public"."admins" "admins_1"
  WHERE ("admins_1"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admin can do anything" ON "public"."events" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admin can insert items" ON "public"."admins" FOR INSERT WITH CHECK ((( SELECT "count"("admins_1"."admin_id") AS "count"
   FROM "public"."admins" "admins_1"
  WHERE ("admins_1"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."graded_answers" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."problem_clarifications" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."problems" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."student_events" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."students" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."teams" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."test_answers" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."test_problems" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."test_takers" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Admins can do anything" ON "public"."tests" USING ((( SELECT "count"("admins"."admin_id") AS "count"
   FROM "public"."admins"
  WHERE ("admins"."admin_id" = "auth"."uid"())) >= 1));



CREATE POLICY "Enable read access for all users" ON "public"."admins" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."problem_clarifications" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."student_events" FOR SELECT USING (true);



CREATE POLICY "Enable student access to the right rows" ON "public"."tests" FOR SELECT USING ("public"."check_test_division_access"("test_id"));



CREATE POLICY "Students can read teammates" ON "public"."students" FOR SELECT USING ("public"."check_teammate"("student_id"));



CREATE POLICY "Students can select their own team" ON "public"."teams" FOR SELECT USING ((( SELECT "count"("student_events".*) AS "count"
   FROM "public"."student_events"
  WHERE (("student_events"."student_id" = "auth"."uid"()) AND ("student_events"."team_id" = "teams"."team_id"))) >= 1));



CREATE POLICY "Students can view their entry" ON "public"."test_takers" FOR SELECT USING ("public"."verify_auth"("test_taker_id", "auth"."uid"()));



CREATE POLICY "Users can see their own rows" ON "public"."test_answers" FOR SELECT USING ("public"."verify_auth"("test_taker_id", "auth"."uid"()));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."graded_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."problem_clarifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."problems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_problems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_takers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."graded_answers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."problem_clarifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."test_answers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."test_takers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tests";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_test_taker"("p_test_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."add_test_taker"("p_test_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_test_taker"("p_test_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_test_taker_2"("p_test_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."add_test_taker_2"("p_test_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_test_taker_2"("p_test_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."change_page"("p_test_taker_id" bigint, "p_page_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."change_page"("p_test_taker_id" bigint, "p_page_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."change_page"("p_test_taker_id" bigint, "p_page_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_teammate"("p_student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_teammate"("p_student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_teammate"("p_student_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_test_division_access"("p_test_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."check_test_division_access"("p_test_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_test_division_access"("p_test_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_test_problems"("p_test_taker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_test_problems"("p_test_taker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_test_problems"("p_test_taker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_test_answer"("p_test_taker_id" bigint, "p_test_problem_id" bigint, "p_answer" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_test_answer"("p_test_taker_id" bigint, "p_test_problem_id" bigint, "p_answer" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_test_answer"("p_test_taker_id" bigint, "p_test_problem_id" bigint, "p_answer" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_auth"("tt_id" bigint, "stud_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_auth"("tt_id" bigint, "stud_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_auth"("tt_id" bigint, "stud_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_test_access"("p_test_taker_id" bigint, "p_student_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_test_access"("p_test_taker_id" bigint, "p_student_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_test_access"("p_test_taker_id" bigint, "p_student_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_event_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_event_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_event_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."graded_answers" TO "anon";
GRANT ALL ON TABLE "public"."graded_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."graded_answers" TO "service_role";



GRANT ALL ON TABLE "public"."test_answers" TO "anon";
GRANT ALL ON TABLE "public"."test_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."test_answers" TO "service_role";



GRANT ALL ON TABLE "public"."test_problems" TO "anon";
GRANT ALL ON TABLE "public"."test_problems" TO "authenticated";
GRANT ALL ON TABLE "public"."test_problems" TO "service_role";



GRANT ALL ON TABLE "public"."graded_answer_count" TO "anon";
GRANT ALL ON TABLE "public"."graded_answer_count" TO "authenticated";
GRANT ALL ON TABLE "public"."graded_answer_count" TO "service_role";



GRANT ALL ON SEQUENCE "public"."graded_answers_graded_answer_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."graded_answers_graded_answer_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."graded_answers_graded_answer_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."graded_answers_problem_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."graded_answers_problem_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."graded_answers_problem_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."test_takers" TO "anon";
GRANT ALL ON TABLE "public"."test_takers" TO "authenticated";
GRANT ALL ON TABLE "public"."test_takers" TO "service_role";



GRANT ALL ON TABLE "public"."tests" TO "anon";
GRANT ALL ON TABLE "public"."tests" TO "authenticated";
GRANT ALL ON TABLE "public"."tests" TO "service_role";



GRANT ALL ON TABLE "public"."graded_test_answers" TO "anon";
GRANT ALL ON TABLE "public"."graded_test_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."graded_test_answers" TO "service_role";



GRANT ALL ON TABLE "public"."guts_tests" TO "anon";
GRANT ALL ON TABLE "public"."guts_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."guts_tests" TO "service_role";



GRANT ALL ON TABLE "public"."problem_clarifications" TO "anon";
GRANT ALL ON TABLE "public"."problem_clarifications" TO "authenticated";
GRANT ALL ON TABLE "public"."problem_clarifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."problem_clarifications_clarification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."problem_clarifications_clarification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."problem_clarifications_clarification_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."problems" TO "anon";
GRANT ALL ON TABLE "public"."problems" TO "authenticated";
GRANT ALL ON TABLE "public"."problems" TO "service_role";



GRANT ALL ON SEQUENCE "public"."problems_problem_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."problems_problem_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."problems_problem_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."student_events" TO "anon";
GRANT ALL ON TABLE "public"."student_events" TO "authenticated";
GRANT ALL ON TABLE "public"."student_events" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."student_events_detailed" TO "anon";
GRANT ALL ON TABLE "public"."student_events_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."student_events_detailed" TO "service_role";



GRANT ALL ON SEQUENCE "public"."student_events_relation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."student_events_relation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."student_events_relation_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_team_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_team_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_team_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."test_answers_relation_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test_answers_relation_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test_answers_relation_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."test_problems_test_problem_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test_problems_test_problem_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test_problems_test_problem_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."test_takers_detailed" TO "anon";
GRANT ALL ON TABLE "public"."test_takers_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."test_takers_detailed" TO "service_role";



GRANT ALL ON SEQUENCE "public"."test_takers_test_taker_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."test_takers_test_taker_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."test_takers_test_taker_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tests_detailed" TO "anon";
GRANT ALL ON TABLE "public"."tests_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."tests_detailed" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tests_test_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tests_test_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tests_test_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
