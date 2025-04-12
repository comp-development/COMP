set check_function_bodies = off;

drop function public.get_test_problem_scans_state(bigint, uuid);

CREATE OR REPLACE FUNCTION public.get_test_problem_scans_state(in_test_id bigint, target_grader uuid)
 RETURNS TABLE(
  test_problem_id bigint, 
  scan_id bigint, 
  scan_path text, 
  total_grades bigint, 
  total_claims bigint, 
  distinct_grades bigint,
  unsure_grades bigint,
  grader_graded boolean
  )
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
    COUNT(DISTINCT scan_grades.grade) as distinct_grades,
    COALESCE(SUM((scan_grades.grade = 'Unsure')::int), 0) as unsure_grades,
    -- whether or not this grader graded this scan+test_problem
    COALESCE(bool_or(scan_grades.grader_id = target_grader and scan_grades.grade is not null), false) as grader_graded
  from test_problems
  join scans on scans.test_id = test_problems.test_id
  left join scan_grades on (scan_grades.test_problem_id = test_problems.test_problem_id) and (scan_grades.scan_id = scans.scan_id)
  where test_problems.test_id = in_test_id
  group by scans.scan_id, test_problems.test_problem_id;
END
$function$
;
