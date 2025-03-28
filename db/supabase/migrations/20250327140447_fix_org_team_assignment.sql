CREATE OR REPLACE FUNCTION public.check_student_team_requirements_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_student_id uuid;
  v_team_id bigint;
  v_org_id bigint;
  v_result boolean;
BEGIN
  -- Determine the student_id, team_id, and org_id based on the operation
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_student_id := NEW.student_id;
    v_team_id := NEW.team_id;
    v_org_id := NEW.org_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
    v_team_id := OLD.team_id;
    v_org_id := OLD.org_id;
  ELSE
    RAISE EXCEPTION 'This trigger should only be used for INSERT, UPDATE, or DELETE operations.';
  END IF;

  -- Call your existing function
  v_result := public.student_team_requirements(v_student_id, v_team_id, v_org_id);

  -- If the function returns false, raise an exception to prevent the operation
  IF NOT v_result THEN
    RAISE EXCEPTION 'An impossible error has occurred. Please email admin@comp.mt immediately if you have encountered this';
  END IF;

  RETURN NEW; -- For INSERT/UPDATE, return the new row
END;
$function$
;

CREATE TRIGGER student_events_requirements_trigger AFTER INSERT OR DELETE OR UPDATE ON public.student_events FOR EACH ROW EXECUTE FUNCTION check_student_team_requirements_trigger();