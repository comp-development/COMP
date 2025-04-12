set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_next_problem(in_test_id bigint, target_grader uuid)
 RETURNS TABLE(test_problem_id bigint, available_scans bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  return query
  select scan_states.test_problem_id, COUNT(*) as available_scans from get_test_problem_scans_state(in_test_id, target_grader) scan_states
  where not grader_graded and total_grades < 2
  group by scan_states.test_problem_id;
END
$function$
;

CREATE OR REPLACE FUNCTION public.get_test_problem_scans_state(in_test_id bigint, target_grader uuid)
 RETURNS TABLE(test_problem_id bigint, scan_id bigint, scan_path text, total_grades bigint, total_claims bigint, grader_graded boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  return query
  select
    test_problems.test_problem_id,
    scans.scan_id,
    scans.scan_path,
    -- number of existing grades
    COUNT(scan_grades.grade) as total_grades,
    -- number of existing grades/claims
    COUNT(*) as total_claims,
    -- whether or not this grader graded this scan+test_problem
    bool_or(scan_grades.grader_id = target_grader and scan_grades.grade is not null) as grader_graded
  from test_problems
  left join scan_grades on scan_grades.test_problem_id = test_problems.test_problem_id
  join scans on scans.test_id = test_problems.test_id
  where test_problems.test_id = in_test_id
  group by scans.scan_id, test_problems.test_problem_id;
END
$function$
;
