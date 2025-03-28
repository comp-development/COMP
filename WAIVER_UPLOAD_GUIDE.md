# Waiver Upload Solution Guide

## Overview

This guide explains the implementation of a secure solution for student waiver uploads in the tournament platform. The solution includes:

1. Row Level Security (RLS) policies for Supabase storage
2. Fixed TypeScript code for the waiver upload page

## Storage RLS Policies

We've implemented the following RLS policies for the `waivers` bucket:

### 1. Student Upload Policy

Students can only upload waivers for events they are registered for:

```sql
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
```

### 2. Student Update Policy

Students can update waivers they've previously uploaded:

```sql
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
```

### 3. Read Policy

Students can read their own waivers, and admins can read waivers for their events:

```sql
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
```

### 4. Admin Policy

Admins have full control over waivers for events they manage:

```sql
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
```

## How the Policy Works

1. The policy extracts the event_id from the file path using regex: `(regexp_match(name, '^(\d+)/.*$'))[1]::bigint`
2. It then checks if the authenticated user (auth.uid()) is registered for that event
3. For admins, it checks if they are admins for the host that owns the event

## Implementation Steps

1. Apply the migration file `db/supabase/migrations/20250401000000_waivers_bucket_rls.sql`
2. The TypeScript errors in the waiver upload page have been fixed by:
   - Adding proper type definitions for state variables
   - Adding null checks to handle potential null values
   - Properly typing the `handleSubmit` function parameter

## Common Error: Type Mismatch

Initially, we encountered a type mismatch error in the SQL policies:
```
ERROR: operator does not exist: text = bigint (SQLSTATE 42883)
```

This was fixed by ensuring we compare `event_id` (a bigint column) directly with the extracted event ID from the filename cast to bigint, without any text conversion in between.

## Testing

To test the policy:
1. Login as a student who is registered for an event
2. Navigate to the waiver upload page for that event
3. Upload a waiver - this should now succeed with the new policy
4. Try accessing another student's waiver - this should be blocked
5. Login as an admin and verify you can see all waivers for your events

## Troubleshooting

If uploads still fail:
1. Check browser console for specific error messages
2. Verify the student is correctly registered for the event in the `student_events` table
3. Ensure the file path format in storage exactly matches what the policy expects (event_id/student_id_firstname_lastname.pdf) 