create policy "coaches can view their organization's students' student_events records"
on "public"."student_events"
as permissive
for all
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
   FROM (org_coaches oc
     JOIN student_events se ON ((se.org_id = oc.org_id)))
  WHERE ((se.student_id = students.student_id) AND (oc.coach_id = auth.uid())))));
