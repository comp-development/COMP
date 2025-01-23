CREATE OR REPLACE FUNCTION public.random_alphanumeric_6()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  chars  text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result text := '';
  i      int;
BEGIN
  -- Generate 6 random characters from the chars set
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$function$
;

drop policy "Enable read access for all users" on "public"."settings";

revoke delete on table "public"."settings" from "anon";

revoke insert on table "public"."settings" from "anon";

revoke references on table "public"."settings" from "anon";

revoke select on table "public"."settings" from "anon";

revoke trigger on table "public"."settings" from "anon";

revoke truncate on table "public"."settings" from "anon";

revoke update on table "public"."settings" from "anon";

revoke delete on table "public"."settings" from "authenticated";

revoke insert on table "public"."settings" from "authenticated";

revoke references on table "public"."settings" from "authenticated";

revoke select on table "public"."settings" from "authenticated";

revoke trigger on table "public"."settings" from "authenticated";

revoke truncate on table "public"."settings" from "authenticated";

revoke update on table "public"."settings" from "authenticated";

revoke delete on table "public"."settings" from "service_role";

revoke insert on table "public"."settings" from "service_role";

revoke references on table "public"."settings" from "service_role";

revoke select on table "public"."settings" from "service_role";

revoke trigger on table "public"."settings" from "service_role";

revoke truncate on table "public"."settings" from "service_role";

revoke update on table "public"."settings" from "service_role";

alter table "public"."settings" drop constraint "settings_pkey";

drop index if exists "public"."settings_pkey";

drop table "public"."settings";

alter table "public"."events" add column "max_team_size" bigint;

alter table "public"."hosts" add column "styles" jsonb;

alter table "public"."org_events" alter column "join_code" set default random_alphanumeric_6();

alter table "public"."org_events" alter column "join_code" set not null;

alter table "public"."teams" alter column "join_code" set default random_alphanumeric_6();

alter table "public"."teams" alter column "join_code" set not null;

CREATE UNIQUE INDEX org_events_join_code_unique ON public.org_events USING btree (event_id, join_code);

CREATE UNIQUE INDEX teams_event_id_join_code_uk ON public.teams USING btree (event_id, join_code);

alter table "public"."events" add constraint "events_max_team_size_check" CHECK ((max_team_size >= 0)) not valid;

alter table "public"."events" validate constraint "events_max_team_size_check";

alter table "public"."org_events" add constraint "org_events_join_code_unique" UNIQUE using index "org_events_join_code_unique";

alter table "public"."teams" add constraint "teams_event_id_join_code_uk" UNIQUE using index "teams_event_id_join_code_uk";

set check_function_bodies = off;





