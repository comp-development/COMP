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
    v_event_id bigint;
begin
    -- Retrieve test details: is_team, opening_time, length, buffer_time
    select t.is_team, t.opening_time, t.length * interval '1 second', t.buffer_time * interval '1 second'
    into v_is_team, v_test_opening_time, v_test_length, v_test_buffer_time
    from tests t
    where t.test_id = p_test_id;

    -- Get event ID 
    select t.event_id
    into v_event_id
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
        from student_events se
        where se.student_id = v_user_id and se.event_id = v_event_id;

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