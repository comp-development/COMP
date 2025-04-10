create policy "Host admins can do anything to problem images c3v78m_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'problem-images'::text) AND (EXISTS ( SELECT 1
   FROM host_admins
  WHERE (((host_admins.host_id)::text = regexp_replace(objects.name, 'host_([^/]+)/.*'::text, '\1'::text)) AND (host_admins.admin_id = auth.uid()) AND host_admins.owner)))));


create policy "Host admins can do anything to problem images c3v78m_1"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'problem-images'::text) AND (EXISTS ( SELECT 1
   FROM host_admins
  WHERE (((host_admins.host_id)::text = regexp_replace(objects.name, 'host_([^/]+)/.*'::text, '\1'::text)) AND (host_admins.admin_id = auth.uid()) AND host_admins.owner)))));


create policy "Host admins can do anything to problem images c3v78m_2"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'problem-images'::text) AND (EXISTS ( SELECT 1
   FROM host_admins
  WHERE (((host_admins.host_id)::text = regexp_replace(objects.name, 'host_([^/]+)/.*'::text, '\1'::text)) AND (host_admins.admin_id = auth.uid()) AND host_admins.owner)))));


create policy "Host admins can do anything to problem images c3v78m_3"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'problem-images'::text) AND (EXISTS ( SELECT 1
   FROM host_admins
  WHERE (((host_admins.host_id)::text = regexp_replace(objects.name, 'host_([^/]+)/.*'::text, '\1'::text)) AND (host_admins.admin_id = auth.uid()) AND host_admins.owner)))));