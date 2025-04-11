alter table "public"."org_events" add column "discord" jsonb;

alter table "public"."student_events" add column "discord" jsonb;

alter table "public"."teams" add column "discord" jsonb;

alter table "public"."tests" alter column "visible" set default true;



