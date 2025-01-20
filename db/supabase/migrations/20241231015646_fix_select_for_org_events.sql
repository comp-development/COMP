drop policy "Enable select for authenticated users only" on "public"."org_events";

create policy "Enable read access for all users"
on "public"."org_events"
as permissive
for select
to authenticated
using (true);
