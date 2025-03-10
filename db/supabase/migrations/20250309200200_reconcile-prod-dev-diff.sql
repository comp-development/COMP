drop view if exists "public"."test_takers_detailed";

alter table "public"."admins" disable row level security;

alter table "public"."coaches" add column "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."events" disable row level security;

alter table "public"."org_events" alter column "created_at" set default (now() AT TIME ZONE 'utc'::text);

alter table "public"."student_events" add column "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."student_events" disable row level security;

alter table "public"."students" drop column "contestdojo_id";

alter table "public"."students" add column "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."students" disable row level security;

alter table "public"."teams" add column "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

set check_function_bodies = off;

create or replace view "public"."org_event_details" as  WITH coach_data AS (
         SELECT oc.org_id,
            string_agg(DISTINCT ((c.first_name || ' '::text) || c.last_name), ', '::text) AS coach_names,
            string_agg(DISTINCT c.email, ', '::text) AS coach_emails
           FROM (org_coaches oc
             JOIN coaches c ON ((oc.coach_id = c.coach_id)))
          GROUP BY oc.org_id
        ), ticket_data AS (
         SELECT ticket_orders.org_id,
            COALESCE(sum(ticket_orders.quantity), (0)::numeric) AS ticket_count
           FROM ticket_orders
          GROUP BY ticket_orders.org_id
        ), student_data AS (
         SELECT student_events.org_id,
            count(student_events.student_event_id) AS students_added,
            count(student_events.team_id) FILTER (WHERE (student_events.team_id IS NOT NULL)) AS students_assigned
           FROM student_events
          GROUP BY student_events.org_id
        ), custom_field_data AS (
         SELECT cfv.org_event_id,
            jsonb_object_agg(cf.key, cfv.value) AS custom_fields
           FROM ((custom_field_values cfv
             JOIN event_custom_fields ecf ON ((cfv.event_custom_field_id = ecf.event_custom_field_id)))
             JOIN custom_fields cf ON ((ecf.custom_field_id = cf.custom_field_id)))
          GROUP BY cfv.org_event_id
        )
 SELECT oe.org_event_id,
    oe.org_id,
    oe.created_at,
    oe.event_id,
    o.name,
    oe.join_code,
    o.address,
    COALESCE(cd.coach_names, ''::text) AS coach_names,
    COALESCE(cd.coach_emails, ''::text) AS coach_emails,
    COALESCE(cf_data.custom_fields, '{}'::jsonb) AS custom_fields,
    COALESCE(td.ticket_count, (0)::numeric) AS ticket_count,
    COALESCE(sd.students_added, (0)::bigint) AS students_added,
    COALESCE(sd.students_assigned, (0)::bigint) AS students_assigned
   FROM (((((org_events oe
     JOIN orgs o ON ((oe.org_id = o.org_id)))
     LEFT JOIN coach_data cd ON ((cd.org_id = oe.org_id)))
     LEFT JOIN ticket_data td ON ((td.org_id = oe.org_id)))
     LEFT JOIN student_data sd ON ((sd.org_id = oe.org_id)))
     LEFT JOIN custom_field_data cf_data ON ((cf_data.org_event_id = oe.org_event_id)));


CREATE OR REPLACE FUNCTION public.check_unique_event_custom_field_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    DECLARE
        new_key text;
        new_table public.custom_field_table;
    BEGIN
        -- Retrieve the key and table for the NEW custom field
        SELECT key, custom_field_table
          INTO new_key, new_table
          FROM public.custom_fields
         WHERE custom_field_id = NEW.custom_field_id;

        IF EXISTS (
            SELECT 1
              FROM public.event_custom_fields ecf
              JOIN public.custom_fields cf
                ON ecf.custom_field_id = cf.custom_field_id
             WHERE ecf.event_id = NEW.event_id
               AND cf.key = new_key
               AND cf.custom_field_table = new_table
               AND ecf.event_custom_field_id <> NEW.event_custom_field_id
        ) THEN
            RAISE EXCEPTION 'Each event must have unique keys for custom fields within the same table';
        END IF;

        RETURN NEW;
    END;
END;$function$
;

create or replace view "public"."test_takers_detailed" as SELECT tt.test_taker_id,
    tt.student_id,
    tt.team_id,
    tt.test_id,
    tt.start_time,
    tt.end_time,
    tt.page_number,
        CASE
            WHEN (tt.student_id IS NOT NULL) THEN concat(s.first_name, ' ', s.last_name)
            WHEN (tt.team_id IS NOT NULL) THEN t.team_name
            ELSE 'Unknown'::text
        END AS taker_name,
        CASE
            WHEN (tt.team_id IS NOT NULL) THEN t.front_id
            WHEN (tt.student_id IS NOT NULL) THEN se.front_id
            ELSE NULL::text
        END AS front_id,
    te.test_name,
    te.division,
    e.event_name
   FROM (((((test_takers tt
     LEFT JOIN students s ON ((tt.student_id = s.student_id)))
     LEFT JOIN teams t ON ((tt.team_id = t.team_id)))
     LEFT JOIN tests te ON ((tt.test_id = te.test_id)))
     LEFT JOIN events e ON ((t.event_id = e.event_id)))
     LEFT JOIN student_events se ON (((te.event_id = t.event_id) AND (s.student_id = se.student_id))));


create policy "Anyone can insert"
on "public"."students"
as permissive
for insert
to public
with check (true);




