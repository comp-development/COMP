drop trigger if exists "trg_check_team_org_id_match" on "public"."student_events";

drop function if exists "public"."check_team_org_id_match"();

drop index if exists "public"."teams_event_org_teamname_ci_uk";

drop index if exists "public"."teams_event_teamname_ci_uk";

-- note the (+0). seed (which we use to generate sample data locally) does not
-- handle columns which are inside an expression for unique indexes. (which is
-- understandable since that would require parsing and evaluating the expressions)
--
-- this is due to a restriction in postgres: listing the columns in a unique constraint
-- will not produce a list that includes columns inside an expression.
--
-- so, if we had a unique index on (event_id, lower(team_name)), seed would see
-- this as a unique index on only (event_id) and would error when creating sample
-- rows with the same event_id. in order to bypass this, we put event_id in a
-- no-op subexpression (event_id + 0) so that seed ignores both columns. this
-- pushes verification from the data generation stage (inside the seed library)
-- to the actual database seeding (when the generated rows get inserted into
-- the postgres database).
--
-- basically, we sacrifice some debuggability on this particular constraint for
-- seed data in order to avoid being unable to use seed or unable to use this
-- constraint.
CREATE UNIQUE INDEX teams_event_org_teamname_ci_uk ON public.teams USING btree (((event_id + 0)), ((org_id + 0)), lower(team_name)) WHERE (org_id IS NOT NULL);

CREATE UNIQUE INDEX teams_event_teamname_ci_uk ON public.teams USING btree (((event_id + 0)), lower(team_name)) WHERE (org_id IS NULL);
