alter table "public"."coaches" disable row level security;

alter table "public"."hosts" disable row level security;

alter table "public"."org_coaches" disable row level security;

alter table "public"."orgs" disable row level security;

create policy "enable read for all users"
on "public"."admins"
as permissive
for select
to public
using (true);