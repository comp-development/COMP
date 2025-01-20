-- the single connection between students and events is now through
-- a student's team_id (in student_events) to the event_id (in teams)

alter table "public"."student_events" drop constraint "student_teams_event_id_fkey";

drop view if exists "public"."student_events_detailed";

drop view if exists "public"."test_takers_detailed";

alter table "public"."student_events" drop column "event_id";

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
