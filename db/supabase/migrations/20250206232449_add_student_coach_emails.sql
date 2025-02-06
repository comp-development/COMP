alter table "public"."coaches" add column "email" text not null;

alter table "public"."students" add column "email" text not null;

CREATE UNIQUE INDEX coaches_email_key ON public.coaches USING btree (email);

CREATE UNIQUE INDEX students_email_key ON public.students USING btree (email);

alter table "public"."coaches" add constraint "coaches_email_key" UNIQUE using index "coaches_email_key";

alter table "public"."students" add constraint "students_email_key" UNIQUE using index "students_email_key";

alter table "public"."admins" add column "email" text not null;

alter table "public"."superadmins" add column "email" text not null;

CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);

CREATE UNIQUE INDEX superadmins_email_key ON public.superadmins USING btree (email);

alter table "public"."admins" add constraint "admins_email_key" UNIQUE using index "admins_email_key";

alter table "public"."superadmins" add constraint "superadmins_email_key" UNIQUE using index "superadmins_email_key";




