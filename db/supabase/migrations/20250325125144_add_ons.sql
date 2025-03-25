create type "public"."entities" as enum ('students', 'teams', 'orgs');

drop view if exists "public"."org_event_details";

CREATE OR REPLACE FUNCTION public.random_id(prefix text DEFAULT NULL::text, len integer DEFAULT 12, chars text DEFAULT 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'::text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  result text := '';
  i int;
  pos int;
BEGIN
  FOR i IN 1..len LOOP
    pos := floor(random() * char_length(chars))::int + 1;
    result := result || substring(chars FROM pos FOR 1);
  END LOOP;
  
  IF prefix IS NOT NULL THEN
    RETURN prefix || result;
  ELSE
    RETURN result;
  END IF;
END;
$function$
;

-- First drop the existing default value
alter table "public"."custom_fields" alter column "custom_field_table" drop default;

-- Then change the data type
alter table "public"."custom_fields" alter column "custom_field_table" set data type entities using "custom_field_table"::text::entities;

-- Then set the default value
alter table "public"."custom_fields" alter column "custom_field_table" set default 'students'::entities;

alter table "public"."org_events" alter column "join_code" set default random_id('O-'::text, 6, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'::text);

alter table "public"."teams" alter column "join_code" set default random_id('T-'::text, 6, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'::text);

drop type "public"."custom_field_table";

create table "public"."addon_orders" (
    "addon_order_id" text not null default random_id('addon_order_'::text),
    "addon_id" text not null,
    "student_event_id" bigint,
    "team_id" bigint,
    "org_event_id" bigint,
    "created_at" timestamp with time zone not null default now(),
    "quantity" integer not null,
    "order_id" text not null
);


create table "public"."addons" (
    "addon_id" text not null default random_id('addon_'::text),
    "created_at" timestamp with time zone not null default now(),
    "event_id" bigint not null,
    "addon_name" text not null,
    "price_cents" bigint not null,
    "enabled" boolean not null default true,
    "addon_table" entities not null default 'orgs'::entities
);




CREATE UNIQUE INDEX addon_orders_pkey ON public.addon_orders USING btree (addon_order_id);

CREATE UNIQUE INDEX addons_pkey ON public.addons USING btree (addon_id);

alter table "public"."addon_orders" add constraint "addon_orders_pkey" PRIMARY KEY using index "addon_orders_pkey";

alter table "public"."addons" add constraint "addons_pkey" PRIMARY KEY using index "addons_pkey";

alter table "public"."addon_orders" add constraint "addon_orders_addon_id_fk" FOREIGN KEY (addon_id) REFERENCES addons(addon_id) not valid;

alter table "public"."addon_orders" validate constraint "addon_orders_addon_id_fk";

alter table "public"."addon_orders" add constraint "addon_orders_addon_id_fkey" FOREIGN KEY (addon_id) REFERENCES addons(addon_id) not valid;

alter table "public"."addon_orders" validate constraint "addon_orders_addon_id_fkey";

alter table "public"."addon_orders" add constraint "addon_orders_org_event_id_fk" FOREIGN KEY (org_event_id) REFERENCES org_events(org_event_id) not valid;

alter table "public"."addon_orders" validate constraint "addon_orders_org_event_id_fk";

alter table "public"."addon_orders" add constraint "addon_orders_student_event_id_fk" FOREIGN KEY (student_event_id) REFERENCES student_events(student_event_id) not valid;

alter table "public"."addon_orders" validate constraint "addon_orders_student_event_id_fk";

alter table "public"."addon_orders" add constraint "addon_orders_team_id_fk" FOREIGN KEY (team_id) REFERENCES teams(team_id) not valid;

alter table "public"."addon_orders" validate constraint "addon_orders_team_id_fk";

alter table "public"."addon_orders" add constraint "exactly_one_entity" CHECK ((((
CASE
    WHEN (student_event_id IS NOT NULL) THEN 1
    ELSE 0
END +
CASE
    WHEN (team_id IS NOT NULL) THEN 1
    ELSE 0
END) +
CASE
    WHEN (org_event_id IS NOT NULL) THEN 1
    ELSE 0
END) = 1)) not valid;

alter table "public"."addon_orders" validate constraint "exactly_one_entity";

alter table "public"."addons" add constraint "event_add_ons_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(event_id) not valid;

alter table "public"."addons" validate constraint "event_add_ons_event_id_fkey";

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


grant delete on table "public"."addon_orders" to "anon";

grant insert on table "public"."addon_orders" to "anon";

grant references on table "public"."addon_orders" to "anon";

grant select on table "public"."addon_orders" to "anon";

grant trigger on table "public"."addon_orders" to "anon";

grant truncate on table "public"."addon_orders" to "anon";

grant update on table "public"."addon_orders" to "anon";

grant delete on table "public"."addon_orders" to "authenticated";

grant insert on table "public"."addon_orders" to "authenticated";

grant references on table "public"."addon_orders" to "authenticated";

grant select on table "public"."addon_orders" to "authenticated";

grant trigger on table "public"."addon_orders" to "authenticated";

grant truncate on table "public"."addon_orders" to "authenticated";

grant update on table "public"."addon_orders" to "authenticated";

grant delete on table "public"."addon_orders" to "service_role";

grant insert on table "public"."addon_orders" to "service_role";

grant references on table "public"."addon_orders" to "service_role";

grant select on table "public"."addon_orders" to "service_role";

grant trigger on table "public"."addon_orders" to "service_role";

grant truncate on table "public"."addon_orders" to "service_role";

grant update on table "public"."addon_orders" to "service_role";

grant delete on table "public"."addons" to "anon";

grant insert on table "public"."addons" to "anon";

grant references on table "public"."addons" to "anon";

grant select on table "public"."addons" to "anon";

grant trigger on table "public"."addons" to "anon";

grant truncate on table "public"."addons" to "anon";

grant update on table "public"."addons" to "anon";

grant delete on table "public"."addons" to "authenticated";

grant insert on table "public"."addons" to "authenticated";

grant references on table "public"."addons" to "authenticated";

grant select on table "public"."addons" to "authenticated";

grant trigger on table "public"."addons" to "authenticated";

grant truncate on table "public"."addons" to "authenticated";

grant update on table "public"."addons" to "authenticated";

grant delete on table "public"."addons" to "service_role";

grant insert on table "public"."addons" to "service_role";

grant references on table "public"."addons" to "service_role";

grant select on table "public"."addons" to "service_role";

grant trigger on table "public"."addons" to "service_role";

grant truncate on table "public"."addons" to "service_role";

grant update on table "public"."addons" to "service_role";



