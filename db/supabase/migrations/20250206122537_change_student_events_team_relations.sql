alter table "public"."student_events" drop constraint "student_events_org_events_fkey";

alter table "public"."student_events" drop constraint "student_events_team_id_org_id_event_id_fkey";

alter table "public"."teams" drop constraint "teams_event_org_teamname_uk";

alter table "public"."teams" drop constraint "teams_team_event_org_uk";

drop index if exists "public"."teams_event_org_teamname_uk";

drop index if exists "public"."teams_team_event_org_uk";

CREATE UNIQUE INDEX teams_event_org_teamname_ci_uk ON public.teams USING btree (event_id, org_id, lower(team_name)) WHERE (org_id IS NOT NULL);

CREATE UNIQUE INDEX teams_event_teamname_ci_uk ON public.teams USING btree (event_id, lower(team_name)) WHERE (org_id IS NULL);

alter table "public"."student_events" add constraint "student_events_event_id_org_id_fkey" FOREIGN KEY (event_id, org_id) REFERENCES org_events(event_id, org_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."student_events" validate constraint "student_events_event_id_org_id_fkey";

alter table "public"."student_events" add constraint "student_events_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(team_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."student_events" validate constraint "student_events_team_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_team_org_id_match()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    -- Check that the team exists
    PERFORM 1
    FROM teams
    WHERE team_id = NEW.team_id
      AND event_id = NEW.event_id
      AND (
        (NEW.org_id IS NULL AND org_id IS NULL)
        OR (NEW.org_id = org_id)
      );
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No matching team found for the provided org_id (including NULL matching)';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER trg_check_team_org_id_match BEFORE INSERT OR UPDATE ON public.student_events FOR EACH ROW EXECUTE FUNCTION check_team_org_id_match();



