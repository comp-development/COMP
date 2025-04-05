alter table "public"."host_admins" add column "grader" boolean not null default false;

alter table "public"."host_admins" add column "owner" boolean not null default false;
