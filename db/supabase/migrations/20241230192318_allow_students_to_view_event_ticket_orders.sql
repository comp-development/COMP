create policy "Enable students to view their own data only"
on "public"."student_org_events"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = student_id));


create policy "Enable students to view their own data only"
on "public"."ticket_orders"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = student_id));
