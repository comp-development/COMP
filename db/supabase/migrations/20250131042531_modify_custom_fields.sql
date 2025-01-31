create type "public"."custom_field_table" as enum ('students', 'teams', 'orgs');

drop policy "Students can select their own rows" on "public"."student_events";

drop policy "Students can update their own rows" on "public"."student_events";

alter table "public"."custom_field_values" drop constraint "custom_field_values_org_event_id_fkey";

alter table "public"."custom_field_values" drop constraint "custom_field_values_student_event_id_fkey";

alter table "public"."custom_field_values" drop constraint "custom_field_values_team_id_fkey";

alter type "public"."custom_field_type" rename to "custom_field_type__old_version_to_be_dropped";

create type "public"."custom_field_type" as enum ('text', 'date', 'paragraph', 'email', 'phone', 'multiple_choice', 'checkboxes', 'dropdown');

alter table "public"."custom_field_values" drop column "response";

alter table "public"."custom_field_values" add column "value" text;

alter table "public"."custom_fields" drop column "type";

alter table "public"."custom_fields" add column "custom_field_table" custom_field_table not null default 'students'::custom_field_table;

alter table "public"."custom_fields" add column "custom_field_type" custom_field_type not null default 'text'::custom_field_type;

alter table "public"."custom_fields" add column "placeholder" text;

alter table "public"."custom_fields" alter column "editable" set default true;

alter table "public"."custom_fields" alter column "editable" set not null;

alter table "public"."custom_fields" alter column "event_id" set not null;

alter table "public"."custom_fields" alter column "hidden" set default false;

alter table "public"."custom_fields" alter column "hidden" set not null;

alter table "public"."custom_fields" alter column "required" set default false;

alter table "public"."custom_fields" alter column "required" set not null;

alter table "public"."custom_fields" disable row level security;

alter table "public"."custom_field_values" add constraint "custom_field_values_org_event_id_fkey" FOREIGN KEY (org_event_id) REFERENCES org_events(org_event_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_field_values" validate constraint "custom_field_values_org_event_id_fkey";

alter table "public"."custom_field_values" add constraint "custom_field_values_student_event_id_fkey" FOREIGN KEY (student_event_id) REFERENCES student_events(student_event_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_field_values" validate constraint "custom_field_values_student_event_id_fkey";

alter table "public"."custom_field_values" add constraint "custom_field_values_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(team_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_field_values" validate constraint "custom_field_values_team_id_fkey";

create policy "Students can do anything with their own rows"
on "public"."student_events"
as permissive
for all
to public
using ((student_id = auth.uid()))
with check ((student_id = auth.uid()));

drop type "public"."custom_field_type__old_version_to_be_dropped";



