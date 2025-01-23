drop policy "Enable students to view their own data only" on "public"."student_org_events";

drop policy "Admins can do anything" on "public"."student_teams";

drop policy "Students can select their own rows" on "public"."student_teams";

drop policy "Students can update their own rows" on "public"."student_teams";

drop policy "Students can select their own team" on "public"."teams";

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

alter table "public"."org_events" drop constraint "org_events_event_id_fkey";

alter table "public"."org_events" drop constraint "org_events_org_id_fkey";

drop view if exists "public"."student_events_detailed";

drop view if exists "public"."test_takers_detailed";

alter table "public"."student_custom_fields" drop constraint "student_custom_fields_pkey";

alter table "public"."student_org_events" drop constraint "student_org_events_pkey";

alter table "public"."student_teams" drop constraint "student_events_pkey";

alter table "public"."org_events" drop constraint "org_events_pkey";

drop index if exists "public"."student_custom_fields_pkey";

drop index if exists "public"."student_org_events_pkey";

drop index if exists "public"."student_team_unique";

drop index if exists "public"."org_events_pkey";

drop index if exists "public"."student_events_pkey";

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
    "ticket_order_id" bigint not null,
    "event_id" bigint not null,
    "org_id" bigint
);


alter table "public"."student_events" enable row level security;

alter table "public"."org_events" drop column "custom_fields";

alter table "public"."org_events" drop column "id";

alter table "public"."org_events" add column "org_event_id" bigint generated by default as identity not null;

alter table "public"."teams" drop column "contestdojo_id";

alter table "public"."teams" drop column "custom_fields";

alter table "public"."teams" drop column "division";

CREATE UNIQUE INDEX custom_field_values_pkey ON public.custom_field_values USING btree (custom_field_value_id);

CREATE UNIQUE INDEX student_event_unique ON public.student_events USING btree (student_id, event_id);

CREATE UNIQUE INDEX teams_team_id_org_id_uk ON public.teams USING btree (team_id, org_id);

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

alter table "public"."student_events" add constraint "student_event_unique" UNIQUE using index "student_event_unique";

alter table "public"."student_events" add constraint "student_events_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) not valid;

alter table "public"."student_events" validate constraint "student_events_event_id_fkey";

alter table "public"."student_events" add constraint "student_events_event_org_fkey" FOREIGN KEY (event_id, org_id) REFERENCES org_events(event_id, org_id) not valid;

alter table "public"."student_events" validate constraint "student_events_event_org_fkey";

alter table "public"."student_events" add constraint "student_events_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE not valid;

alter table "public"."student_events" validate constraint "student_events_student_id_fkey";

alter table "public"."student_events" add constraint "student_events_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(team_id) not valid;

alter table "public"."student_events" validate constraint "student_events_team_id_fkey";

alter table "public"."student_events" add constraint "student_events_team_org_fkey" FOREIGN KEY (team_id, org_id) REFERENCES teams(team_id, org_id) not valid;

alter table "public"."student_events" validate constraint "student_events_team_org_fkey";

alter table "public"."student_events" add constraint "student_team_requirements" CHECK (student_team_requirements(student_id, team_id, ticket_order_id)) not valid;

alter table "public"."student_events" validate constraint "student_team_requirements";

alter table "public"."student_events" add constraint "student_teams_order_id_fkey" FOREIGN KEY (ticket_order_id) REFERENCES ticket_orders(id) not valid;

alter table "public"."student_events" validate constraint "student_teams_order_id_fkey";

alter table "public"."teams" add constraint "teams_team_id_org_id_uk" UNIQUE using index "teams_team_id_org_id_uk";

alter table "public"."org_events" add constraint "org_events_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) not valid;

alter table "public"."org_events" validate constraint "org_events_event_id_fkey";

alter table "public"."org_events" add constraint "org_events_org_id_fkey" FOREIGN KEY (org_id) REFERENCES orgs(org_id) not valid;      

alter table "public"."org_events" validate constraint "org_events_org_id_fkey";

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