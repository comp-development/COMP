drop index if exists "public"."unique_custom_field_id_org_event_id";

drop index if exists "public"."unique_custom_field_id_student_event_id";

drop index if exists "public"."unique_custom_field_id_team_id";

CREATE UNIQUE INDEX unique_custom_field_values ON public.custom_field_values USING btree (custom_field_id, org_event_id, student_event_id, team_id);

alter table "public"."custom_field_values" add constraint "unique_custom_field_values" UNIQUE using index "unique_custom_field_values";



