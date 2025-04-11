set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.evaluate_access_rules(p_student_id uuid, p_rules_json jsonb, p_test_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$DECLARE
    combine_logic text;
    current_rule jsonb;
    field_name text;
    operator text;
    v_value text;
    actual_value text;
    rule_result boolean;
    child_result boolean;
    v_event_id bigint;
    v_student_event_id bigint;
BEGIN
    -- Get event ID 
    select t.event_id
    into v_event_id
    from tests t
    where t.test_id = p_test_id;
    RAISE NOTICE 'Starting evaluate_access_rules for student_id: %, rules_json: %', p_student_id, p_rules_json;

    -- get unique Student Event ID from Student uuid and event_id
    SELECT student_event_id
    INTO v_student_event_id
    FROM students s
    LEFT JOIN student_events se on s.student_id = se.student_id 
    where s.student_id = p_student_id and event_id = v_event_id;

    -- Check if the input JSON is null or empty
    IF p_rules_json IS NULL OR p_rules_json = '{}'::jsonb THEN
        RAISE NOTICE 'Input rules_json is null or empty. Returning true.';
        RETURN true;
    END IF;

    -- Check if the input is a combined rule
    IF p_rules_json ? 'combine' THEN
        -- Extract the "combine" key to determine logical operator ("AND"/"OR")
        combine_logic := p_rules_json->>'combine';
        RAISE NOTICE 'Detected combined rule with combine_logic: %', combine_logic;

        -- Default result based on combine logic
        IF combine_logic = 'AND' THEN
            rule_result := true; -- AND starts with true (neutral value)
        ELSE
            rule_result := false; -- OR starts with false (neutral value)
        END IF;

        -- Iterate through the "rules" array
        FOR current_rule IN SELECT * FROM jsonb_array_elements(p_rules_json->'rules')
        LOOP
            RAISE NOTICE 'Evaluating child rule: %', current_rule;

            -- Recursively evaluate nested rules or individual rules
            child_result := evaluate_access_rules(p_student_id, current_rule, p_test_id);

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
        field_name := p_rules_json->>'field';
        operator := p_rules_json->>'operator';
        v_value := p_rules_json->>'value';

        RAISE NOTICE 'Evaluating single rule: field: %, operator: %, value: %', field_name, operator, v_value;

        -- Validate that the field_name is not null
        IF field_name IS NULL OR field_name = '' THEN
            RAISE EXCEPTION 'Field name cannot be NULL or empty in rule: %', p_rules_json;
        END IF;

        BEGIN
            SELECT value 
            INTO actual_value
            FROM custom_field_values
            LEFT JOIN event_custom_fields on custom_field_values.event_custom_field_id = event_custom_fields.event_custom_field_id
            LEFT JOIN custom_fields on event_custom_fields.custom_field_id = custom_fields.custom_field_id
            where student_event_id = v_student_event_id and key = field_name ;

            -- IF actual_value is NULL THEN 
            --     EXECUTE format('SELECT %I FROM students WHERE student_id = $1', field_name)
            --     INTO actual_value
            --     USING p_student_id;
            -- END IF;
            RAISE NOTICE 'Fetched actual_value: % for field_name: %', actual_value, field_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Error fetching value for field: %, error: %', field_name, SQLERRM;
        END;

        -- Evaluate the operator dynamically
        BEGIN
            RETURN CASE
                WHEN operator = '=' THEN actual_value = v_value
                WHEN operator = '!=' THEN actual_value != v_value
                WHEN operator = '>' THEN actual_value::numeric > v_value::numeric
                WHEN operator = '>=' THEN actual_value::numeric >= v_value::numeric
                WHEN operator = '<' THEN actual_value::numeric < v_value::numeric
                WHEN operator = '<=' THEN actual_value::numeric <= v_value::numeric
                WHEN operator = 'IN' THEN actual_value = ANY (string_to_array(v_value, ','))
                WHEN operator = 'NOT IN' THEN NOT (actual_value = ANY (string_to_array(v_value, ',')))
                WHEN operator = '~' THEN actual_value ~ v_value -- Regex match
                WHEN operator = '!~' THEN NOT (actual_value ~ v_value) -- Regex does not match
                WHEN operator = '~*' THEN actual_value ~* v_value -- Case-insensitive regex match
                WHEN operator = '!~*' THEN NOT (actual_value ~* v_value) -- Case-insensitive regex does not match
            END CASE;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Error evaluating rule: %, error: %', p_rules_json, SQLERRM;
        END;
    END IF;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_students_with_access(p_test_id bigint)
 RETURNS TABLE(student_id uuid, first_name text, last_name text, email text, division text)
 LANGUAGE plpgsql
AS $function$declare
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
          and evaluate_access_rules(s.student_id, v_access_rules, p_test_id); -- Apply access rules
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
          and evaluate_access_rules(s.student_id, v_access_rules, p_test_id); -- Apply access rules
    end if;
end;$function$
;

CREATE OR REPLACE FUNCTION public.get_students_with_access_updated(p_test_id bigint)
 RETURNS TABLE(student_id uuid, first_name text, last_name text, email text)
 LANGUAGE plpgsql
AS $function$declare
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
        where se.event_id = v_event_id  and evaluate_access_rules(s.student_id, v_access_rules, p_test_id) ; -- Apply access rules
    end if;
end;$function$
;