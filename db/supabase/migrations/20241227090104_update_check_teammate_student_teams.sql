set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_teammate(p_student_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    v_auth_uid uuid := auth.uid()::uuid;  -- Current user's ID
begin
    -- Check if there is at least one overlapping team_id
    return exists (
        select 1
        from student_teams se1
        join student_teams se2
        on se1.team_id = se2.team_id
        where se1.student_id = v_auth_uid
        and se2.student_id = p_student_id
    );
end;$function$
;
