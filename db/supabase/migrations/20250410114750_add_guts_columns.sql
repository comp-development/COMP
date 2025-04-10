alter table "public"."guts_grades" drop column "correct";

alter table "public"."guts_grades" add column "score" bigint;

alter table "public"."guts_grades" add column "status" text;

alter table "public"."guts_grades" add column "test_id" bigint;

alter table "public"."guts_grades" alter column "grader_id" drop not null;

alter table "public"."guts_grades" add constraint "guts_grades_test_id_fkey" FOREIGN KEY (test_id) REFERENCES tests(test_id) not valid;

alter table "public"."guts_grades" validate constraint "guts_grades_test_id_fkey";
