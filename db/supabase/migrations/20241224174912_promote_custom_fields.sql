-- removes custom_fields json column in student_events table
-- replaces with a student_custom_fields table

drop view if exists "public"."student_events_detailed";

drop view if exists "public"."test_takers_detailed";

create table "public"."student_custom_fields" (
    "student_id" uuid not null,
    "custom_field_id" bigint not null,
    "response" jsonb
);


alter table "public"."student_custom_fields" enable row level security;

alter table "public"."student_events" drop column "custom_fields";

CREATE UNIQUE INDEX student_custom_fields_pkey ON public.student_custom_fields USING btree (student_id, custom_field_id);

alter table "public"."student_custom_fields" add constraint "student_custom_fields_pkey" PRIMARY KEY using index "student_custom_fields_pkey";

alter table "public"."student_custom_fields" add constraint "student_custom_fields_custom_field_id_fkey" FOREIGN KEY (custom_field_id) REFERENCES custom_fields(custom_field_id) not valid;

alter table "public"."student_custom_fields" validate constraint "student_custom_fields_custom_field_id_fkey";

alter table "public"."student_custom_fields" add constraint "student_custom_fields_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(student_id) not valid;

alter table "public"."student_custom_fields" validate constraint "student_custom_fields_student_id_fkey";

create or replace view "public"."student_events_detailed" as  SELECT se.relation_id,
    se.student_id,
    se.team_id,
    se.front_id,
    t.event_id,
    se.division,
    s.first_name,
    s.last_name,
    (u.email)::text AS email
   FROM (((student_events se
     JOIN students s ON ((se.student_id = s.student_id)))
     JOIN teams t ON ((se.team_id = t.team_id)))
     JOIN auth.users u ON ((u.id = s.student_id)));


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


grant delete on table "public"."student_custom_fields" to "anon";

grant insert on table "public"."student_custom_fields" to "anon";

grant references on table "public"."student_custom_fields" to "anon";

grant select on table "public"."student_custom_fields" to "anon";

grant trigger on table "public"."student_custom_fields" to "anon";

grant truncate on table "public"."student_custom_fields" to "anon";

grant update on table "public"."student_custom_fields" to "anon";

grant delete on table "public"."student_custom_fields" to "authenticated";

grant insert on table "public"."student_custom_fields" to "authenticated";

grant references on table "public"."student_custom_fields" to "authenticated";

grant select on table "public"."student_custom_fields" to "authenticated";

grant trigger on table "public"."student_custom_fields" to "authenticated";

grant truncate on table "public"."student_custom_fields" to "authenticated";

grant update on table "public"."student_custom_fields" to "authenticated";

grant delete on table "public"."student_custom_fields" to "service_role";

grant insert on table "public"."student_custom_fields" to "service_role";

grant references on table "public"."student_custom_fields" to "service_role";

grant select on table "public"."student_custom_fields" to "service_role";

grant trigger on table "public"."student_custom_fields" to "service_role";

grant truncate on table "public"."student_custom_fields" to "service_role";

grant update on table "public"."student_custom_fields" to "service_role";
