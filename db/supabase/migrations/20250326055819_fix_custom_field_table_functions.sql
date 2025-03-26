CREATE OR REPLACE FUNCTION public.check_unique_event_custom_field_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    DECLARE
        new_key text;
        new_table public.entities;
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



