create policy "coaches can view their organization's students' records"
on "public"."student_events"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM org_coaches oc
  WHERE ((student_events.org_id = oc.org_id) AND (oc.coach_id = auth.uid())))));


create policy "coaches can view their org's students' records"
on "public"."students"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((org_coaches oc
     JOIN teams t ON ((t.org_id = oc.org_id)))
     JOIN student_events se ON ((se.team_id = t.team_id)))
  WHERE ((se.student_id = students.student_id) AND (oc.coach_id = auth.uid())))));
