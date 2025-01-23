alter table "public"."student_events" drop constraint "student_team_requirements";

alter table "public"."student_events" drop constraint "student_teams_order_id_fkey";

drop view if exists "public"."test_takers_detailed";

alter table "public"."events" alter column "event_name" set not null;

alter table "public"."hosts" alter column "host_name" set not null;

alter table "public"."student_events" drop column "ticket_order_id";

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




