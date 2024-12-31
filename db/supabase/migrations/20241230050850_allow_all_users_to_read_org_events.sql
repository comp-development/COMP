create policy "Enable select for authenticated users only"
on "public"."org_events"
as permissive
for select
to authenticated;
