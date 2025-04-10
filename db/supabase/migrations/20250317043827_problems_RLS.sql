alter table "public"."problems" add column "host_id" bigint;

alter table "public"."problems" enable row level security;

alter table "public"."problems" add constraint "problems_host_id_fkey" FOREIGN KEY (host_id) REFERENCES hosts(host_id) not valid;

alter table "public"."problems" validate constraint "problems_host_id_fkey";

set check_function_bodies = off;


create policy "host_admins_can_do_anything"
on "public"."problems"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM host_admins
  WHERE ((host_admins.host_id = problems.host_id) AND (host_admins.admin_id = auth.uid())))));