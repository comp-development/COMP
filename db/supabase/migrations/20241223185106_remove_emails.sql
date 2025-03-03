drop view if exists "public"."student_events_detailed";

alter table "public"."coaches" drop column "email";

alter table "public"."students" drop column "email";

create or replace view "public"."student_events_detailed" as  SELECT se.relation_id,
    se.student_id,
    se.team_id,
    se.front_id,
    se.event_id,
    se.division,
    s.first_name,
    s.last_name,
    (u.email)::text AS email
   FROM ((student_events se
     JOIN students s ON ((se.student_id = s.student_id)))
     JOIN auth.users u ON ((u.id = s.student_id)));
