alter table "public"."hosts" alter column "invites" set default '{}'::jsonb[];

alter table "public"."hosts" alter column "invites" set not null;

alter table "public"."hosts" alter column "invites" set data type jsonb[] using "invites"::jsonb[];