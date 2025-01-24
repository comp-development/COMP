drop policy "Enable read access for all users" on "public"."settings";

drop policy "Enable students to view their own data only" on "public"."student_org_events";

drop policy "Admins can do anything" on "public"."student_teams";

drop policy "Students can select their own rows" on "public"."student_teams";

drop policy "Students can update their own rows" on "public"."student_teams";

drop policy "Students can select their own team" on "public"."teams";

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

revoke delete on table "public"."student_custom_fields" from "anon";

revoke insert on table "public"."student_custom_fields" from "anon";

revoke references on table "public"."student_custom_fields" from "anon";

revoke select on table "public"."student_custom_fields" from "anon";

revoke trigger on table "public"."student_custom_fields" from "anon";

revoke truncate on table "public"."student_custom_fields" from "anon";

revoke update on table "public"."student_custom_fields" from "anon";

revoke delete on table "public"."student_custom_fields" from "authenticated";

revoke insert on table "public"."student_custom_fields" from "authenticated";

revoke references on table "public"."student_custom_fields" from "authenticated";

revoke select on table "public"."student_custom_fields" from "authenticated";

revoke trigger on table "public"."student_custom_fields" from "authenticated";

revoke truncate on table "public"."student_custom_fields" from "authenticated";

revoke update on table "public"."student_custom_fields" from "authenticated";

revoke delete on table "public"."student_custom_fields" from "service_role";

revoke insert on table "public"."student_custom_fields" from "service_role";

revoke references on table "public"."student_custom_fields" from "service_role";

revoke select on table "public"."student_custom_fields" from "service_role";

revoke trigger on table "public"."student_custom_fields" from "service_role";

revoke truncate on table "public"."student_custom_fields" from "service_role";

revoke update on table "public"."student_custom_fields" from "service_role";

revoke delete on table "public"."student_org_events" from "anon";

revoke insert on table "public"."student_org_events" from "anon";

revoke references on table "public"."student_org_events" from "anon";

revoke select on table "public"."student_org_events" from "anon";

revoke trigger on table "public"."student_org_events" from "anon";

revoke truncate on table "public"."student_org_events" from "anon";

revoke update on table "public"."student_org_events" from "anon";

revoke delete on table "public"."student_org_events" from "authenticated";

revoke insert on table "public"."student_org_events" from "authenticated";

revoke references on table "public"."student_org_events" from "authenticated";

revoke select on table "public"."student_org_events" from "authenticated";

revoke trigger on table "public"."student_org_events" from "authenticated";

revoke truncate on table "public"."student_org_events" from "authenticated";

revoke update on table "public"."student_org_events" from "authenticated";

revoke delete on table "public"."student_org_events" from "service_role";

revoke insert on table "public"."student_org_events" from "service_role";

revoke references on table "public"."student_org_events" from "service_role";

revoke select on table "public"."student_org_events" from "service_role";

revoke trigger on table "public"."student_org_events" from "service_role";

revoke truncate on table "public"."student_org_events" from "service_role";

revoke update on table "public"."student_org_events" from "service_role";

revoke delete on table "public"."student_teams" from "anon";

revoke insert on table "public"."student_teams" from "anon";

revoke references on table "public"."student_teams" from "anon";

revoke select on table "public"."student_teams" from "anon";

revoke trigger on table "public"."student_teams" from "anon";

revoke truncate on table "public"."student_teams" from "anon";

revoke update on table "public"."student_teams" from "anon";

revoke delete on table "public"."student_teams" from "authenticated";

revoke insert on table "public"."student_teams" from "authenticated";

revoke references on table "public"."student_teams" from "authenticated";

revoke select on table "public"."student_teams" from "authenticated";

revoke trigger on table "public"."student_teams" from "authenticated";

revoke truncate on table "public"."student_teams" from "authenticated";

revoke update on table "public"."student_teams" from "authenticated";

revoke delete on table "public"."student_teams" from "service_role";

revoke insert on table "public"."student_teams" from "service_role";

revoke references on table "public"."student_teams" from "service_role";

revoke select on table "public"."student_teams" from "service_role";

revoke trigger on table "public"."student_teams" from "service_role";

revoke truncate on table "public"."student_teams" from "service_role";

revoke update on table "public"."student_teams" from "service_role";

alter table "public"."student_custom_fields" drop constraint "student_custom_fields_custom_field_id_fkey";

alter table "public"."student_custom_fields" drop constraint "student_custom_fields_student_id_fkey";

alter table "public"."student_org_events" drop constraint "student_event_orgs_event_id_fkey";

alter table "public"."student_org_events" drop constraint "student_event_orgs_student_id_fkey";

alter table "public"."student_teams" drop constraint "student_events_student_id_fkey";

alter table "public"."student_teams" drop constraint "student_events_team_id_fkey";

alter table "public"."student_teams" drop constraint "student_team_requirements";

alter table "public"."student_teams" drop constraint "student_team_unique";

alter table "public"."student_teams" drop constraint "student_teams_order_id_fkey";

alter table "public"."teams" drop constraint "disallow_team_join_code_for_org_teams";

alter table "public"."teams" drop constraint "org_joined_event_for_team";

alter table "public"."teams" drop constraint "teams_org_id_fkey";

alter table "public"."org_events" drop constraint "org_events_event_id_fkey";

alter table "public"."org_events" drop constraint "org_events_org_id_fkey";

alter table "public"."teams" drop constraint "teams_event_id_fkey";

drop function if exists "public"."check_org_event_pair_exists"(in_org_id bigint, in_event_id bigint);

drop view if exists "public"."student_events_detailed";

drop function if exists "public"."student_team_requirements"(in_student_id uuid, in_team_id bigint, in_ticket_order_id bigint);

drop view if exists "public"."test_takers_detailed";

alter table "public"."settings" drop constraint "settings_pkey";

alter table "public"."student_custom_fields" drop constraint "student_custom_fields_pkey";

alter table "public"."student_org_events" drop constraint "student_org_events_pkey";

alter table "public"."student_teams" drop constraint "student_events_pkey";

alter table "public"."org_events" drop constraint "org_events_pkey";

drop index if exists "public"."settings_pkey";

drop index if exists "public"."student_custom_fields_pkey";

drop index if exists "public"."student_org_events_pkey";

drop index if exists "public"."student_team_unique";

drop index if exists "public"."org_events_pkey";

drop index if exists "public"."student_events_pkey";

drop table "public"."settings";

drop table "public"."student_custom_fields";

drop table "public"."student_org_events";

drop table "public"."student_teams";

create table "public"."custom_field_values" (
    "custom_field_id" bigint not null,
    "response" text,
    "team_id" bigint,
    "org_event_id" bigint,
    "custom_field_value_id" bigint generated by default as identity not null,
    "student_event_id" bigint
);


create table "public"."student_events" (
    "student_event_id" bigint generated by default as identity not null,
    "student_id" uuid not null,
    "team_id" bigint,
    "front_id" text,
    "event_id" bigint not null,
    "org_id" bigint
);


alter table "public"."student_events" enable row level security;

alter table "public"."events" add column "max_team_size" bigint;

alter table "public"."events" alter column "event_name" set not null;

alter table "public"."hosts" add column "styles" jsonb;

alter table "public"."hosts" alter column "host_name" set not null;

alter table "public"."org_events" drop column "custom_fields";

alter table "public"."org_events" drop column "id";

alter table "public"."org_events" add column "org_event_id" bigint generated by default as identity not null;

alter table "public"."org_events" alter column "event_id" set not null;

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

alter table "public"."org_events" alter column "join_code" set default random_alphanumeric_6();

alter table "public"."org_events" alter column "join_code" set not null;

alter table "public"."org_events" alter column "org_id" set not null;

alter table "public"."teams" drop column "contestdojo_id";

alter table "public"."teams" drop column "custom_fields";

alter table "public"."teams" drop column "division";

alter table "public"."teams" alter column "join_code" set default random_alphanumeric_6();

alter table "public"."teams" alter column "join_code" set not null;

alter table "public"."teams" alter column "team_name" set not null;

CREATE UNIQUE INDEX custom_field_values_pkey ON public.custom_field_values USING btree (custom_field_value_id);

CREATE UNIQUE INDEX org_events_join_code_unique ON public.org_events USING btree (event_id, join_code);

CREATE UNIQUE INDEX student_event_unique ON public.student_events USING btree (student_id, event_id);

CREATE UNIQUE INDEX teams_event_id_join_code_uk ON public.teams USING btree (event_id, join_code);

CREATE UNIQUE INDEX teams_team_event_uk ON public.teams USING btree (team_id, event_id);

CREATE UNIQUE INDEX teams_team_org_uk ON public.teams USING btree (team_id, org_id);

CREATE UNIQUE INDEX unique_custom_field_id_org_event_id ON public.custom_field_values USING btree (custom_field_id, org_event_id) WHERE (org_event_id IS NOT NULL);

CREATE UNIQUE INDEX unique_custom_field_id_student_event_id ON public.custom_field_values USING btree (custom_field_id, student_event_id) WHERE (student_event_id IS NOT NULL);

CREATE UNIQUE INDEX unique_custom_field_id_team_id ON public.custom_field_values USING btree (custom_field_id, team_id) WHERE (team_id IS NOT NULL);

CREATE UNIQUE INDEX org_events_pkey ON public.org_events USING btree (org_event_id);

CREATE UNIQUE INDEX student_events_pkey ON public.student_events USING btree (student_event_id);

alter table "public"."custom_field_values" add constraint "custom_field_values_pkey" PRIMARY KEY using index "custom_field_values_pkey";

alter table "public"."student_events" add constraint "student_events_pkey" PRIMARY KEY using index "student_events_pkey";

alter table "public"."org_events" add constraint "org_events_pkey" PRIMARY KEY using index "org_events_pkey";

alter table "public"."custom_field_values" add constraint "custom_field_values_org_event_id_fkey" FOREIGN KEY (org_event_id) REFERENCES org_events(org_event_id) not valid;

alter table "public"."custom_field_values" validate constraint "custom_field_values_org_event_id_fkey";

alter table "public"."custom_field_values" add constraint "custom_field_values_student_event_id_fkey" FOREIGN KEY (student_event_id) REFERENCES student_events(student_event_id) not valid;

alter table "public"."custom_field_values" validate constraint "custom_field_values_student_event_id_fkey";

alter table "public"."custom_field_values" add constraint "custom_field_values_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(team_id) not valid;

alter table "public"."custom_field_values" validate constraint "custom_field_values_team_id_fkey";

alter table "public"."custom_field_values" add constraint "exactly_one_not_null" CHECK ((((((student_event_id IS NOT NULL))::integer + ((team_id IS NOT NULL))::integer) + ((org_event_id IS NOT NULL))::integer) = 1)) not valid;

alter table "public"."custom_field_values" validate constraint "exactly_one_not_null";

alter table "public"."custom_field_values" add constraint "student_custom_fields_custom_field_id_fkey" FOREIGN KEY (custom_field_id) REFERENCES custom_fields(custom_field_id) not valid;

alter table "public"."custom_field_values" validate constraint "student_custom_fields_custom_field_id_fkey";

alter table "public"."events" add constraint "events_max_team_size_check" CHECK ((max_team_size >= 0)) not valid;

alter table "public"."events" validate constraint "events_max_team_size_check";

alter table "public"."org_events" add constraint "org_events_join_code_unique" UNIQUE using index "org_events_join_code_unique";

alter table "public"."student_events" add constraint "student_event_unique" UNIQUE using index "student_event_unique";

alter table "public"."student_events" add constraint "student_events_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) not valid;

alter table "public"."student_events" validate constraint "student_events_event_id_fkey";

alter table "public"."student_events" add constraint "student_events_org_events_fkey" FOREIGN KEY (event_id, org_id) REFERENCES org_events(event_id, org_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."student_events" validate constraint "student_events_org_events_fkey";

alter table "public"."student_events" add constraint "student_events_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(student_id) not valid;

alter table "public"."student_events" validate constraint "student_events_student_id_fkey";

alter table "public"."student_events" add constraint "student_events_team_event_fkey" FOREIGN KEY (team_id, event_id) REFERENCES teams(team_id, event_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."student_events" validate constraint "student_events_team_event_fkey";

alter table "public"."student_events" add constraint "student_events_team_org_fkey" FOREIGN KEY (team_id, org_id) REFERENCES teams(team_id, org_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."student_events" validate constraint "student_events_team_org_fkey";

alter table "public"."teams" add constraint "teams_event_id_join_code_uk" UNIQUE using index "teams_event_id_join_code_uk";

alter table "public"."teams" add constraint "teams_org_events_fkey" FOREIGN KEY (event_id, org_id) REFERENCES org_events(event_id, org_id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."teams" validate constraint "teams_org_events_fkey";

alter table "public"."teams" add constraint "teams_team_event_uk" UNIQUE using index "teams_team_event_uk";

alter table "public"."teams" add constraint "teams_team_org_uk" UNIQUE using index "teams_team_org_uk";

alter table "public"."org_events" add constraint "org_events_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) not valid;

alter table "public"."org_events" validate constraint "org_events_event_id_fkey";

alter table "public"."org_events" add constraint "org_events_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(org_id) not valid;

alter table "public"."org_events" validate constraint "org_events_org_id_fkey";

alter table "public"."teams" add constraint "teams_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) not valid;

alter table "public"."teams" validate constraint "teams_event_id_fkey";

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
        from student_events se1
        join student_events se2
        on se1.team_id = se2.team_id
        where se1.student_id = v_auth_uid
        and se2.student_id = p_student_id
    );
end;$function$
;

CREATE OR REPLACE FUNCTION public.check_test_access(p_test_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$declare
    v_is_team boolean;
    v_test_visible boolean;
    v_test_division text;
    v_event_id bigint;
    v_user_event_id bigint;
    v_user_division text;
    v_team_division text;
    v_access_rules jsonb;
    v_auth_uid uuid := auth.uid()::uuid;  -- Cast auth.uid() to uuid
begin
    -- Retrieve test details: is_team, division, and event_id
    select t.is_team, t.division, t.event_id, t.visible, t.access_rules
    into v_is_team, v_test_division, v_event_id, v_test_visible, v_access_rules
    from tests t
    where t.test_id = p_test_id;

    -- Verify that the user is associated with the testΓÇÖs event
    if v_is_team then
        -- Get the user's team's event_id and division
        select tm.event_id, tm.division
        into v_user_event_id, v_team_division
        from student_events st
        join teams tm on st.team_id = tm.team_id
        where st.student_id = v_auth_uid;

        -- Ensure the teamΓÇÖs event_id matches the testΓÇÖs event_id
        if v_user_event_id != v_event_id then
            return false;
        end if;

        v_user_division := v_team_division;

    else
        -- not handling individual currently
        -- -- Get the user's event_id and division
        -- select st.event_id, st.division
        -- into v_user_event_id, v_user_division
        -- from student_events st
        -- where st.student_id = v_auth_uid;

        -- -- Ensure the student's event_id matches the testΓÇÖs event_id
        -- if v_user_event_id != v_event_id then
        --     return false;
        -- end if;
    end if;

    if v_test_visible is not true then
        return false;
    end if;

    -- Check if the division is required and matches
    if v_test_division is not null and v_test_division != '' then
        return v_user_division = v_test_division;
    end if;

    -- Evaluate access rules using the current user and the test's access_rules
    if not evaluate_access_rules(v_auth_uid, v_access_rules) then
        return false;
    end if;

    return true;
end;$function$
;

create or replace view "public"."test_takers_detailed" as  SELECT tt.test_taker_id,
    tt.student_id,
    tt.team_id,
    tt.test_id,
    tt.start_time,
    tt.end_time,
    tt.page_number,
        CASE
            WHEN (tt.student_id IS NOT NULL) THEN concat(s.first_name, ' ', s.last_name)
            WHEN (tt.team_id IS NOT NULL) THEN t.team_name
            ELSE 'Unknown'::text
        END AS taker_name,
        CASE
            WHEN (tt.team_id IS NOT NULL) THEN t.front_id
            WHEN (tt.student_id IS NOT NULL) THEN se.front_id
            ELSE NULL::text
        END AS front_id,
    te.test_name,
    te.division,
    e.event_name
   FROM (((((test_takers tt
     LEFT JOIN students s ON ((tt.student_id = s.student_id)))
     LEFT JOIN teams t ON ((tt.team_id = t.team_id)))
     LEFT JOIN tests te ON ((tt.test_id = te.test_id)))
     LEFT JOIN events e ON ((t.event_id = e.event_id)))
     LEFT JOIN student_events se ON (((te.event_id = t.event_id) AND (s.student_id = se.student_id))));


grant delete on table "public"."custom_field_values" to "anon";

grant insert on table "public"."custom_field_values" to "anon";

grant references on table "public"."custom_field_values" to "anon";

grant select on table "public"."custom_field_values" to "anon";

grant trigger on table "public"."custom_field_values" to "anon";

grant truncate on table "public"."custom_field_values" to "anon";

grant update on table "public"."custom_field_values" to "anon";

grant delete on table "public"."custom_field_values" to "authenticated";

grant insert on table "public"."custom_field_values" to "authenticated";

grant references on table "public"."custom_field_values" to "authenticated";

grant select on table "public"."custom_field_values" to "authenticated";

grant trigger on table "public"."custom_field_values" to "authenticated";

grant truncate on table "public"."custom_field_values" to "authenticated";

grant update on table "public"."custom_field_values" to "authenticated";

grant delete on table "public"."custom_field_values" to "service_role";

grant insert on table "public"."custom_field_values" to "service_role";

grant references on table "public"."custom_field_values" to "service_role";

grant select on table "public"."custom_field_values" to "service_role";

grant trigger on table "public"."custom_field_values" to "service_role";

grant truncate on table "public"."custom_field_values" to "service_role";

grant update on table "public"."custom_field_values" to "service_role";

grant delete on table "public"."student_events" to "anon";

grant insert on table "public"."student_events" to "anon";

grant references on table "public"."student_events" to "anon";

grant select on table "public"."student_events" to "anon";

grant trigger on table "public"."student_events" to "anon";

grant truncate on table "public"."student_events" to "anon";

grant update on table "public"."student_events" to "anon";

grant delete on table "public"."student_events" to "authenticated";

grant insert on table "public"."student_events" to "authenticated";

grant references on table "public"."student_events" to "authenticated";

grant select on table "public"."student_events" to "authenticated";

grant trigger on table "public"."student_events" to "authenticated";

grant truncate on table "public"."student_events" to "authenticated";

grant update on table "public"."student_events" to "authenticated";

grant delete on table "public"."student_events" to "service_role";

grant insert on table "public"."student_events" to "service_role";

grant references on table "public"."student_events" to "service_role";

grant select on table "public"."student_events" to "service_role";

grant trigger on table "public"."student_events" to "service_role";

grant truncate on table "public"."student_events" to "service_role";

grant update on table "public"."student_events" to "service_role";

create policy "Admins can do anything"
on "public"."student_events"
as permissive
for all
to public
using ((( SELECT count(superadmins.superadmin_id) AS count
   FROM superadmins
  WHERE (superadmins.superadmin_id = auth.uid())) >= 1));


create policy "Students can select their own rows"
on "public"."student_events"
as permissive
for select
to public
using ((student_id = auth.uid()));


create policy "Students can update their own rows"
on "public"."student_events"
as permissive
for update
to public
using ((student_id = auth.uid()))
with check ((student_id = auth.uid()));


create policy "Students can select their own team"
on "public"."teams"
as permissive
for select
to public
using ((( SELECT count(student_events.*) AS count
   FROM student_events
  WHERE ((student_events.student_id = auth.uid()) AND (student_events.team_id = teams.team_id))) >= 1));




