alter table "public"."custom_fields" alter column "event_id" drop not null;

CREATE UNIQUE INDEX unique_event_custom_field_org_event ON public.custom_field_values USING btree (event_custom_field_id, org_event_id) WHERE (org_event_id IS NOT NULL);

CREATE UNIQUE INDEX unique_event_custom_field_student_event ON public.custom_field_values USING btree (event_custom_field_id, student_event_id) WHERE (student_event_id IS NOT NULL);

CREATE UNIQUE INDEX unique_event_custom_field_team ON public.custom_field_values USING btree (event_custom_field_id, team_id) WHERE (team_id IS NOT NULL);

alter table "public"."custom_fields" add constraint "exactly_one_not_null" CHECK (((((event_id IS NOT NULL))::integer + ((host_id IS NOT NULL))::integer) = 1)) not valid;

alter table "public"."custom_fields" validate constraint "exactly_one_not_null";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_event_custom_fields_event_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (
        (SELECT event_id FROM public.custom_fields WHERE custom_field_id = NEW.custom_field_id) IS NOT NULL
        AND NEW.event_id <> (SELECT event_id FROM public.custom_fields WHERE custom_field_id = NEW.custom_field_id)
    ) THEN
        RAISE EXCEPTION 'event_custom_fields.event_id must match custom_fields.event_id, or custom_fields.event_id must be NULL';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_unique_event_custom_field_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.event_custom_fields ecf
        JOIN public.custom_fields cf ON ecf.custom_field_id = cf.custom_field_id
        WHERE ecf.event_id = NEW.event_id
        AND cf.key = (SELECT key FROM public.custom_fields WHERE custom_field_id = NEW.custom_field_id)
        AND ecf.event_custom_field_id <> NEW.event_custom_field_id
    ) THEN
        RAISE EXCEPTION 'Each event must have unique keys for custom fields';
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE TRIGGER enforce_event_custom_fields_event_id BEFORE INSERT OR UPDATE ON public.event_custom_fields FOR EACH ROW EXECUTE FUNCTION check_event_custom_fields_event_id();

CREATE TRIGGER enforce_unique_event_custom_field_key BEFORE INSERT OR UPDATE ON public.event_custom_fields FOR EACH ROW EXECUTE FUNCTION check_unique_event_custom_field_key();

drop index if exists "public"."unique_event_custom_field_org_event";

drop index if exists "public"."unique_event_custom_field_student_event";

drop index if exists "public"."unique_event_custom_field_team";

CREATE UNIQUE INDEX unique_custom_field_event ON public.event_custom_fields USING btree (custom_field_id, event_id);      

CREATE UNIQUE INDEX unique_event_custom_field_org_event ON public.custom_field_values USING btree (event_custom_field_id, org_event_id);

CREATE UNIQUE INDEX unique_event_custom_field_student_event ON public.custom_field_values USING btree (event_custom_field_id, student_event_id);

CREATE UNIQUE INDEX unique_event_custom_field_team ON public.custom_field_values USING btree (event_custom_field_id, team_id);

alter table "public"."custom_field_values" add constraint "unique_event_custom_field_org_event" UNIQUE using index "unique_event_custom_field_org_event";

alter table "public"."custom_field_values" add constraint "unique_event_custom_field_student_event" UNIQUE using index "unique_event_custom_field_student_event";

alter table "public"."custom_field_values" add constraint "unique_event_custom_field_team" UNIQUE using index "unique_event_custom_field_team";

alter table "public"."event_custom_fields" add constraint "unique_custom_field_event" UNIQUE using index "unique_custom_field_event";

