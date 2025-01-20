alter table "public"."settings" enable row level security;

create policy "Enable read access for all users"
on "public"."settings"
as permissive
for all
to public
using (true);
