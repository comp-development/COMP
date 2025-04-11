alter table "public"."test_answers" drop constraint "test_answers_test_problem_id_fkey";

alter table "public"."test_answers" add constraint "test_answers_test_problem_id_fkey" FOREIGN KEY (test_problem_id) REFERENCES test_problems(test_problem_id) not valid;

alter table "public"."test_answers" validate constraint "test_answers_test_problem_id_fkey";

