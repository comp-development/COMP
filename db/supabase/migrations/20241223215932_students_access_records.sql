create policy "Students can manipulate their own records"
on "public"."students"
as permissive
for all
to public
using ((auth.uid() = student_id));
