set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_students_with_access_updated(p_test_id bigint)
 RETURNS TABLE(student_id uuid, first_name text, last_name text, email text)
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
            s.email
            --tm.division
        from students s
        join student_events se on s.student_id = se.student_id
        join teams tm on se.team_id = tm.team_id
        where se.event_id = v_event_id;
        --   and (v_test_division is null or v_test_division = '' or tm.division = v_test_division)
        --   and evaluate_access_rules(s.student_id, v_access_rules); -- Apply access rules
    else
        return query
        select 
            s.student_id,
            s.first_name,
            s.last_name,
            s.email
            -- se.division
        from students s
        join student_events se on s.student_id = se.student_id
        where se.event_id = v_event_id
          and evaluate_access_rules(s.student_id, v_access_rules); -- Apply access rules
    end if;
end;
$function$
;