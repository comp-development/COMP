-- Waivers bucket RLS policy
-- Allow students to upload their own waivers

-- Create a policy to allow students to upload/replace their own waivers
create policy "Students can upload their own waivers"
on storage.objects
for insert
to public
with check (
  bucket_id = 'waivers' AND
  (auth.uid() = (
    SELECT student_id
    FROM student_events
    WHERE student_id = auth.uid() AND event_id = (regexp_match(name, '^(\d+)/.*$'))[1]::bigint
  ))
);

-- Create a policy to allow students to update their own waivers
create policy "Students can update their own waivers"
on storage.objects
for update
to public
using (
  bucket_id = 'waivers' AND
  (auth.uid() = (
    SELECT student_id
    FROM student_events
    WHERE student_id = auth.uid() AND event_id = (regexp_match(name, '^(\d+)/.*$'))[1]::bigint
  ))
) 
with check (
  bucket_id = 'waivers' AND
  (auth.uid() = (
    SELECT student_id
    FROM student_events
    WHERE student_id = auth.uid() AND event_id = (regexp_match(name, '^(\d+)/.*$'))[1]::bigint
  ))
);

-- Create a policy to allow students to read waivers they have access to
create policy "Students can read waivers for their events"
on storage.objects
for select
to public
using (
  bucket_id = 'waivers' AND
  (
    -- Student can read their own waivers
    (auth.uid() = (
      SELECT student_id
      FROM student_events
      WHERE student_id = auth.uid() AND event_id = (regexp_match(name, '^(\d+)/.*$'))[1]::bigint
    ))
    OR
    -- Admin can read waivers for their events
    EXISTS (
      SELECT 1
      FROM host_admins ha
      JOIN events e ON e.host_id = ha.host_id
      WHERE e.event_id = (regexp_match(name, '^(\d+)/.*$'))[1]::bigint
      AND ha.admin_id = auth.uid()
    )
  )
);

-- Create a policy to allow administrators to read all waivers
create policy "Admins can manage all waivers"
on storage.objects
for all
to public
using (
  bucket_id = 'waivers' AND
  (
    EXISTS (
      SELECT 1
      FROM host_admins ha
      JOIN events e ON e.host_id = ha.host_id
      WHERE e.event_id = (regexp_match(name, '^(\d+)/.*$'))[1]::bigint
      AND ha.admin_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1
      FROM admins
      WHERE admin_id = auth.uid()
    )
  )
); 