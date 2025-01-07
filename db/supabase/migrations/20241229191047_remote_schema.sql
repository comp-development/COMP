create policy "Admins can read"
on "public"."custom_fields"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) IN ( SELECT admins.admin_id
   FROM admins)));



