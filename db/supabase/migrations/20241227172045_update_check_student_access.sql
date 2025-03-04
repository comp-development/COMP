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
        select tm.event_id, tm.division
        into v_user_event_id, v_team_division
        from student_teams st
        join teams tm on st.team_id = tm.team_id
        where st.student_id = v_auth_uid;

        -- Ensure the team’s event_id matches the test’s event_id
        if v_user_event_id != v_event_id then
            return false;
        end if;

        v_user_division := v_team_division;

    else
        -- not handling individual currently
        -- -- Get the user's event_id and division
        -- select st.event_id, st.division
        -- into v_user_event_id, v_user_division
        -- from student_teams st
        -- where st.student_id = v_auth_uid;

        -- -- Ensure the student's event_id matches the test’s event_id
        -- if v_user_event_id != v_event_id then
        --     return false;
        -- end if;
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
