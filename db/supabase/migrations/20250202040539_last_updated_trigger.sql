alter table "public"."event_custom_fields" disable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.last_updated_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.last_updated = NOW() AT TIME ZONE 'UTC';
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER last_updated_trigger BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION last_updated_trigger();