alter table "public"."custom_fields" alter column "custom_field_type" drop default;

alter type "public"."custom_field_type" rename to "custom_field_type__old_version_to_be_dropped";

create type "public"."custom_field_type" as enum ('text', 'number', 'date', 'paragraph', 'email', 'phone', 'multiple_choice', 'checkboxes', 'dropdown');

alter table "public"."custom_fields" alter column custom_field_type type "public"."custom_field_type" using custom_field_type::text::"public"."custom_field_type";

alter table "public"."custom_fields" alter column "custom_field_type" set default 'text'::custom_field_type;

drop type "public"."custom_field_type__old_version_to_be_dropped";

alter table "public"."tests" alter column "test_name" set not null;



