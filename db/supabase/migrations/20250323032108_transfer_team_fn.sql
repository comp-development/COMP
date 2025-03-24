-- Create a new function to transfer a team to an organization
-- This handles the entire operation as a single transaction
CREATE OR REPLACE FUNCTION transfer_team_to_organization(
  p_team_id INT,
  p_new_org_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_org_id INT;
  v_student_count INT;
  v_team_record JSONB;
  v_updated_students JSONB;
BEGIN
  -- Get the team's current org_id (will fail with NOT_FOUND if team doesn't exist)
  SELECT org_id INTO v_old_org_id FROM teams WHERE team_id = p_team_id;
  
  -- Count students in the team (for the result)
  SELECT COUNT(*) INTO v_student_count 
  FROM student_events 
  WHERE team_id = p_team_id;
  
  -- 1. Update the team - PostgreSQL will handle foreign key constraints
  UPDATE teams 
  SET org_id = p_new_org_id
  WHERE team_id = p_team_id
  RETURNING to_jsonb(teams.*) INTO v_team_record;

  -- 2. Update all students in the team - PostgreSQL will handle foreign key constraints
  WITH updated_records AS (
    UPDATE student_events
    SET org_id = p_new_org_id
    WHERE team_id = p_team_id
    RETURNING *
  )
  SELECT jsonb_agg(to_jsonb(ur.*)) INTO v_updated_students
  FROM updated_records ur;

  -- If no students were updated, initialize as empty array
  IF v_updated_students IS NULL THEN
    v_updated_students := '[]'::jsonb;
  END IF;

  -- Return success result
  RETURN jsonb_build_object(
    'team', v_team_record,
    'students', v_updated_students,
    'student_count', v_student_count,
    'old_org_id', v_old_org_id,
    'new_org_id', p_new_org_id
  );
END;
$$;

-- Grant access to the authenticated users
GRANT EXECUTE ON FUNCTION transfer_team_to_organization(INT, INT) TO authenticated;

-- Add a comment
COMMENT ON FUNCTION transfer_team_to_organization(INT, INT) IS 
'Transfers a team to a new organization and updates all associated students in a single transaction.
Relies on PostgreSQL constraint handling for validation and error reporting.'; 