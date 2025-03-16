
alter table "public"."graded_answers" disable row level security;

alter table "public"."problem_clarifications" disable row level security;

alter table "public"."problems" disable row level security;

alter table "public"."superadmins" disable row level security;

alter table "public"."test_answers" disable row level security;

alter table "public"."test_problems" disable row level security;

alter table "public"."test_takers" disable row level security;

alter table "public"."tests" disable row level security;

alter table "public"."ticket_orders" disable row level security;

set check_function_bodies = off;

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

CREATE OR REPLACE FUNCTION public.check_test_access(p_test_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    v_is_team boolean;
    v_test_visible boolean;
    v_event_id bigint;
    v_user_event_id bigint;
    v_access_rules jsonb;
    v_auth_uid uuid := auth.uid()::uuid;  -- Cast auth.uid() to uuid
begin
    -- Retrieve test details: is_team, division, and event_id
    select t.is_team, t.event_id, t.visible, t.access_rules
    into v_is_team, v_event_id, v_test_visible, v_access_rules
    from tests t
    where t.test_id = p_test_id;

    -- Verify that the user is associated with the test's event
    if v_is_team then
        -- Get the user's team's event_id and division
        select tm.event_id
        into v_user_event_id
        from student_events st
        join teams tm on st.team_id = tm.team_id
        where st.student_id = v_auth_uid;

        -- Ensure the team's event_id matches the test's event_id
        if v_user_event_id != v_event_id then
            return false;
        end if;
    else
        -- not handling individual currently
        -- -- Get the user's event_id and division
        -- select st.event_id, st.division
        -- into v_user_event_id, v_user_division
        -- from student_events st
        -- where st.student_id = v_auth_uid;

        -- -- Ensure the student's event_id matches the test's event_id
        -- if v_user_event_id != v_event_id then
        --     return false;
        -- end if;
    end if;

    if v_test_visible is not true then
        return false;
    end if;

    -- -- Evaluate access rules using the current user and the test's access_rules
    -- if not evaluate_access_rules(v_auth_uid, v_access_rules) then
    --     return false;
    -- end if;

    return true;
end;$function$
;
