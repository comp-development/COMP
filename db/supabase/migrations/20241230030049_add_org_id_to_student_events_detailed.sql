drop view if exists "public"."student_events_detailed";

create or replace view "public"."student_events_detailed" as  SELECT se.relation_id,
    se.student_id,
    se.team_id,
    se.front_id,
    se.division,
    s.first_name,
    s.last_name,
    (u.email)::text AS email,
    t.event_id,
    t.org_id
   FROM (((student_teams se
     JOIN students s ON ((se.student_id = s.student_id)))
     JOIN teams t ON ((se.team_id = t.team_id)))
     JOIN auth.users u ON ((u.id = s.student_id)));
