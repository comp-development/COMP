alter table "public"."problems" drop constraint "problems_compose_problem_id_key";

drop index if exists "public"."problems_compose_problem_id_key";

CREATE UNIQUE INDEX unique_compose_problem_id_host_id_combo ON public.problems USING btree (compose_problem_id, host_id);

CREATE UNIQUE INDEX unique_compose_test_id_event_id_combo ON public.tests USING btree (compose_test_id, event_id);

alter table "public"."problems" add constraint "unique_compose_problem_id_host_id_combo" UNIQUE using index "unique_compose_problem_id_host_id_combo";

alter table "public"."tests" add constraint "unique_compose_test_id_event_id_combo" UNIQUE using index "unique_compose_test_id_event_id_combo";