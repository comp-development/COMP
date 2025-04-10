-- Create puzzles table
CREATE TABLE "public"."puzzles" (
    "puzzle_id" BIGINT GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    "puzzle" JSONB DEFAULT '[]'::JSONB,
    "solution" JSONB DEFAULT '[]'::JSONB,
    "host_id" BIGINT NOT NULL
);

ALTER TABLE "public"."puzzles" ENABLE ROW LEVEL SECURITY;

-- Add columns to test_problems table
ALTER TABLE "public"."test_problems" ADD COLUMN "difficulty" BIGINT;
ALTER TABLE "public"."test_problems" ADD COLUMN "puzzle_id" BIGINT;
ALTER TABLE "public"."test_problems" ALTER COLUMN "problem_id" DROP NOT NULL;

-- Set primary key for puzzles
CREATE UNIQUE INDEX puzzles_pkey ON public.puzzles USING btree (puzzle_id);
ALTER TABLE "public"."puzzles" ADD CONSTRAINT "puzzles_pkey" PRIMARY KEY USING INDEX "puzzles_pkey";

-- Foreign key constraints
ALTER TABLE "public"."puzzles" ADD CONSTRAINT "puzzles_host_id_fkey" 
    FOREIGN KEY (host_id) REFERENCES hosts(host_id) NOT VALID;
ALTER TABLE "public"."puzzles" VALIDATE CONSTRAINT "puzzles_host_id_fkey";

ALTER TABLE "public"."test_problems" ADD CONSTRAINT "test_problems_puzzle_id_fkey" 
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(puzzle_id) NOT VALID;
ALTER TABLE "public"."test_problems" VALIDATE CONSTRAINT "test_problems_puzzle_id_fkey";

SET check_function_bodies = OFF;

-- Function: enforce_puzzle_test_mode_constraint
CREATE OR REPLACE FUNCTION public.enforce_puzzle_test_mode_constraint()
RETURNS TRIGGER AS $$
DECLARE
    fetched_test_mode TEXT;
BEGIN
    -- Fetch test_mode from the tests table
    SELECT test_mode INTO fetched_test_mode FROM tests WHERE test_id = NEW.test_id;

    -- Enforce rules
    IF NEW.puzzle_id IS NOT NULL AND fetched_test_mode IS DISTINCT FROM 'Puzzle' THEN
        RAISE EXCEPTION 'If puzzle_id is NOT NULL, test_mode must be "Puzzle"';
    ELSIF NEW.problem_id IS NOT NULL AND fetched_test_mode = 'Puzzle' THEN
        RAISE EXCEPTION 'If problem_id is NOT NULL, test_mode cannot be "Puzzle"';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: enforce_test_puzzle_problem_constraint
CREATE OR REPLACE FUNCTION public.enforce_test_puzzle_problem_constraint()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.problem_id IS NULL AND NEW.puzzle_id IS NULL) OR 
       (NEW.problem_id IS NOT NULL AND NEW.puzzle_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Exactly one of problem_id or puzzle_id must be NOT NULL';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: check_test_problem_host_match
CREATE OR REPLACE FUNCTION public.check_test_problem_host_match()
RETURNS TRIGGER AS $$
DECLARE
    test_event_host_id BIGINT;
    problem_host_id BIGINT;
    puzzle_host_id BIGINT;
BEGIN
    -- Ensure at least one of problem_id or puzzle_id is set
    IF NEW.problem_id IS NULL AND NEW.puzzle_id IS NULL THEN
        RAISE EXCEPTION 'Either problem_id or puzzle_id must be provided';
    END IF;

    -- Get host_id from the test's event
    SELECT e.host_id INTO test_event_host_id
    FROM public.tests t
    JOIN public.events e ON t.event_id = e.event_id
    WHERE t.test_id = NEW.test_id;

    IF test_event_host_id IS NULL THEN
        RAISE EXCEPTION 'Test ID % does not belong to a valid event with a host', NEW.test_id;
    END IF;

    -- Validate host_id for problem_id
    IF NEW.problem_id IS NOT NULL THEN
        SELECT host_id INTO problem_host_id FROM public.problems WHERE problem_id = NEW.problem_id;
        IF problem_host_id IS DISTINCT FROM test_event_host_id THEN
            RAISE EXCEPTION 'Problem host_id does not match Event host_id';
        END IF;
    END IF;

    -- Validate host_id for puzzle_id
    IF NEW.puzzle_id IS NOT NULL THEN
        SELECT host_id INTO puzzle_host_id FROM public.puzzles WHERE puzzle_id = NEW.puzzle_id;
        IF puzzle_host_id IS DISTINCT FROM test_event_host_id THEN
            RAISE EXCEPTION 'Puzzle host_id does not match Event host_id';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (Optimized)
GRANT ALL ON TABLE "public"."puzzles" TO "anon", "authenticated", "service_role";

-- Create triggers
CREATE TRIGGER check_puzzle_test_mode_constraint
BEFORE INSERT OR UPDATE ON public.test_problems
FOR EACH ROW EXECUTE FUNCTION enforce_puzzle_test_mode_constraint();

CREATE TRIGGER check_test_puzzle_problem_constraint
BEFORE INSERT OR UPDATE ON public.test_problems
FOR EACH ROW EXECUTE FUNCTION enforce_test_puzzle_problem_constraint();

CREATE TRIGGER enforce_test_problem_host_match 
BEFORE INSERT OR UPDATE ON public.test_problems 
FOR EACH ROW EXECUTE FUNCTION check_test_problem_host_match();