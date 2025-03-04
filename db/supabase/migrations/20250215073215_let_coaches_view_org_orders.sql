create policy "coaches can view their org's orders"
on "public"."ticket_orders"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM org_coaches oc
  WHERE ((oc.coach_id = auth.uid()) AND (oc.org_id = ticket_orders.org_id)))));

