create table "public"."guts_grades" (
    "guts_grade_id" bigint generated by default as identity not null,
    "graded_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "team_id" bigint not null,
    "test_problem_id" bigint not null,
    "answer_latex" text,
    "correct" boolean,
    "grader_id" uuid not null
);


alter table "public"."problems" disable row level security;

alter table "public"."test_problems" disable row level security;

CREATE UNIQUE INDEX guts_grades_pkey ON public.guts_grades USING btree (guts_grade_id);

CREATE UNIQUE INDEX single_grade_per_team_problem ON public.guts_grades USING btree (team_id, test_problem_id);

alter table "public"."guts_grades" add constraint "guts_grades_pkey" PRIMARY KEY using index "guts_grades_pkey";

alter table "public"."guts_grades" add constraint "guts_grades_grader_id_fkey" FOREIGN KEY (grader_id) REFERENCES admins(admin_id) not valid;

alter table "public"."guts_grades" validate constraint "guts_grades_grader_id_fkey";

alter table "public"."guts_grades" add constraint "guts_grades_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(team_id) not valid;

alter table "public"."guts_grades" validate constraint "guts_grades_team_id_fkey";

alter table "public"."guts_grades" add constraint "guts_grades_test_problem_id_fkey" FOREIGN KEY (test_problem_id) REFERENCES test_problems(test_problem_id) not valid;

alter table "public"."guts_grades" validate constraint "guts_grades_test_problem_id_fkey";

alter table "public"."guts_grades" add constraint "single_grade_per_team_problem" UNIQUE using index "single_grade_per_team_problem";

grant delete on table "public"."guts_grades" to "anon";

grant insert on table "public"."guts_grades" to "anon";

grant references on table "public"."guts_grades" to "anon";

grant select on table "public"."guts_grades" to "anon";

grant trigger on table "public"."guts_grades" to "anon";

grant truncate on table "public"."guts_grades" to "anon";

grant update on table "public"."guts_grades" to "anon";

grant delete on table "public"."guts_grades" to "authenticated";

grant insert on table "public"."guts_grades" to "authenticated";

grant references on table "public"."guts_grades" to "authenticated";

grant select on table "public"."guts_grades" to "authenticated";

grant trigger on table "public"."guts_grades" to "authenticated";

grant truncate on table "public"."guts_grades" to "authenticated";

grant update on table "public"."guts_grades" to "authenticated";

grant delete on table "public"."guts_grades" to "service_role";

grant insert on table "public"."guts_grades" to "service_role";

grant references on table "public"."guts_grades" to "service_role";

grant select on table "public"."guts_grades" to "service_role";

grant trigger on table "public"."guts_grades" to "service_role";

grant truncate on table "public"."guts_grades" to "service_role";

grant update on table "public"."guts_grades" to "service_role";



