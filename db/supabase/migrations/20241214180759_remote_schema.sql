drop policy "Enable read access for all users" on "public"."student_events";

drop policy "Enable student access to the right rows" on "public"."tests";

drop function if exists "public"."add_test_taker"(p_test_id bigint);
drop function if exists "public"."add_test_taker_2"(p_test_id bigint);

drop function if exists "public"."check_test_division_access"(p_test_id bigint);

drop function if exists "public"."verify_test_access"(p_test_taker_id bigint, p_student_id uuid);

alter table "public"."tests" alter column "access_rules" drop default;

alter table "public"."tests" alter column "access_rules" drop not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_test_access(p_test_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    v_is_team boolean;
    v_test_visible boolean;
    v_test_division text;
    v_event_id bigint;
    v_user_event_id bigint;
    v_user_division text;
    v_team_division text;
    v_access_rules jsonb;
    v_auth_uid uuid := auth.uid()::uuid;  -- Cast auth.uid() to uuid
begin
    -- Retrieve test details: is_team, division, and event_id
    select t.is_team, t.division, t.event_id, t.visible, t.access_rules
    into v_is_team, v_test_division, v_event_id, v_test_visible, v_access_rules
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

    -- Evaluate access rules using the current user and the test's access_rules
    if not evaluate_access_rules(v_auth_uid, v_access_rules) then
        return false;
    end if;

    return true;
end;$function$
;

CREATE OR REPLACE FUNCTION public.evaluate_access_rules(student_id uuid, rules_json jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
    combine_logic text;
    current_rule jsonb;
    field_name text;
    operator text;
    value text;
    actual_value text;
    rule_result boolean;
    child_result boolean;
BEGIN
    RAISE NOTICE 'Starting evaluate_access_rules for student_id: %, rules_json: %', student_id, rules_json;

    -- Check if the input JSON is null or empty
    IF rules_json IS NULL OR rules_json = '{}'::jsonb THEN
        RAISE NOTICE 'Input rules_json is null or empty. Returning true.';
        RETURN true;
    END IF;

    -- Check if the input is a combined rule
    IF rules_json ? 'combine' THEN
        -- Extract the "combine" key to determine logical operator ("AND"/"OR")
        combine_logic := rules_json->>'combine';
        RAISE NOTICE 'Detected combined rule with combine_logic: %', combine_logic;

        -- Default result based on combine logic
        IF combine_logic = 'AND' THEN
            rule_result := true; -- AND starts with true (neutral value)
        ELSE
            rule_result := false; -- OR starts with false (neutral value)
        END IF;

        -- Iterate through the "rules" array
        FOR current_rule IN SELECT * FROM jsonb_array_elements(rules_json->'rules')
        LOOP
            RAISE NOTICE 'Evaluating child rule: %', current_rule;

            -- Recursively evaluate nested rules or individual rules
            child_result := evaluate_access_rules(student_id, current_rule);

            RAISE NOTICE 'Child rule result: %, combine_logic: %', child_result, combine_logic;

            -- Combine results based on the logical operator
            IF combine_logic = 'AND' THEN
                rule_result := rule_result AND child_result;
            ELSE
                rule_result := rule_result OR child_result;
            END IF;

            -- Short-circuit evaluation: stop processing further if result is definitive
            IF (combine_logic = 'AND' AND NOT rule_result) OR (combine_logic = 'OR' AND rule_result) THEN
                RAISE NOTICE 'Short-circuit: combine_logic: %, result: %', combine_logic, rule_result;
                RETURN rule_result;
            END IF;
        END LOOP;

        RAISE NOTICE 'Final result for combined rule: %', rule_result;
        RETURN rule_result;

    ELSE
        -- Handle single rule evaluation
        field_name := rules_json->>'field';
        operator := rules_json->>'operator';
        value := rules_json->>'value';

        RAISE NOTICE 'Evaluating single rule: field: %, operator: %, value: %', field_name, operator, value;

        -- Validate that the field_name is not null
        IF field_name IS NULL OR field_name = '' THEN
            RAISE EXCEPTION 'Field name cannot be NULL or empty in rule: %', rules_json;
        END IF;

        -- Fetch the actual value for the field (example for "students" table)
        BEGIN
            EXECUTE format('SELECT %I FROM students WHERE student_id = $1', field_name)
            INTO actual_value
            USING student_id;

            RAISE NOTICE 'Fetched actual_value: % for field_name: %', actual_value, field_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Error fetching value for field: %, error: %', field_name, SQLERRM;
        END;

        -- Evaluate the operator dynamically
        BEGIN
            RETURN CASE
                WHEN operator = '=' THEN actual_value = value
                WHEN operator = '!=' THEN actual_value != value
                WHEN operator = '>' THEN actual_value::numeric > value::numeric
                WHEN operator = '>=' THEN actual_value::numeric >= value::numeric
                WHEN operator = '<' THEN actual_value::numeric < value::numeric
                WHEN operator = '<=' THEN actual_value::numeric <= value::numeric
                WHEN operator = 'IN' THEN actual_value = ANY (string_to_array(value, ','))
                WHEN operator = 'NOT IN' THEN NOT (actual_value = ANY (string_to_array(value, ',')))
                WHEN operator = '~' THEN actual_value ~ value -- Regex match
                WHEN operator = '!~' THEN NOT (actual_value ~ value) -- Regex does not match
                WHEN operator = '~*' THEN actual_value ~* value -- Case-insensitive regex match
                WHEN operator = '!~*' THEN NOT (actual_value ~* value) -- Case-insensitive regex does not match
            END CASE;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Error evaluating rule: %, error: %', rules_json, SQLERRM;
        END;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_students_with_access(p_test_id bigint)
 RETURNS TABLE(student_id uuid, first_name text, last_name text, email text, division text)
 LANGUAGE plpgsql
AS $function$
declare
    v_is_team boolean;
    v_test_visible boolean;
    v_test_division text;
    v_event_id bigint;
    v_access_rules jsonb;
begin
    -- Retrieve test details: is_team, division, event_id, visible, and access_rules
    select t.is_team, t.division, t.event_id, t.visible, t.access_rules
    into v_is_team, v_test_division, v_event_id, v_test_visible, v_access_rules
    from tests t
    where t.test_id = p_test_id;

    -- If the test is not visible, return an empty result set
    if v_test_visible is not true then
        return;
    end if;

    -- Retrieve all students who are associated with the test's event
    if v_is_team then
        return query
        select 
            s.student_id,
            s.first_name,
            s.last_name,
            s.email,
            tm.division
        from students s
        join student_events se on s.student_id = se.student_id
        join teams tm on se.team_id = tm.team_id
        where se.event_id = v_event_id
          and (v_test_division is null or v_test_division = '' or tm.division = v_test_division)
          and evaluate_access_rules(s.student_id, v_access_rules); -- Apply access rules
    else
        return query
        select 
            s.student_id,
            s.first_name,
            s.last_name,
            s.email,
            se.division
        from students s
        join student_events se on s.student_id = se.student_id
        where se.event_id = v_event_id
          and (v_test_division is null or v_test_division = '' or se.division = v_test_division)
          and evaluate_access_rules(s.student_id, v_access_rules); -- Apply access rules
    end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_test_taker_access(p_test_taker_id bigint, p_student_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
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
end;$function$
;

CREATE OR REPLACE FUNCTION public.add_test_taker(p_test_id bigint)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
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
    if not check_test_access(p_test_id) then
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
end;$function$
;

CREATE OR REPLACE FUNCTION public.change_page(p_test_taker_id bigint, p_page_number integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    starttime_res timestamptz;
    endtime_res timestamptz;
    current_page_number integer;
begin
    -- Check if the user is authorized to make the change
    if not verify_test_taker_access(p_test_taker_id, auth.uid()) then
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
end;$function$
;

CREATE OR REPLACE FUNCTION public.fetch_test_problems(p_test_taker_id bigint)
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    v_test_id bigint;
    v_page_number int;
    v_auth_uid uuid := auth.uid();  -- Current user's ID, of type UUID
begin
    -- Step 1: Verify user has access to the test
    if not verify_test_taker_access(p_test_taker_id, v_auth_uid) then
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
end;$function$
;

CREATE OR REPLACE FUNCTION public.upsert_test_answer(p_test_taker_id bigint, p_test_problem_id bigint, p_answer text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    upsert_result integer;
    test_taker_page integer;
    test_problem_page integer;
    melt_time integer;  -- meltTime in seconds
    problem_number integer;
    test_melt_time interval;
begin
    -- Call 'verify_test_access' to check if the user is authorized and the timing is valid
    if not verify_test_taker_access(p_test_taker_id, auth.uid()) then
        return 'Access denied';
    end if;

    -- Fetch page_number of test_taker and melt_time (in seconds) of the associated test
    select tt.page_number, (t.settings->>'meltTime')::integer
    into test_taker_page, melt_time
    from test_takers tt
    join tests t on tt.test_id = t.test_id
    where tt.test_taker_id = p_test_taker_id;

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
end;$function$
;

create policy "Students can select their own rows"
on "public"."student_events"
as permissive
for select
to public
using ((student_id = auth.uid()));


create policy "Students can update their own rows"
on "public"."student_events"
as permissive
for update
to public
using ((student_id = auth.uid()))
with check ((student_id = auth.uid()));


create policy "Check Student Test Access"
on "public"."tests"
as permissive
for select
to public
using (check_test_access(test_id));



