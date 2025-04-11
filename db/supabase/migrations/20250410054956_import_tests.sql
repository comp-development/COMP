alter table "public"."problems" add column "compose_problem_id" bigint;

alter table "public"."tests" add column "compose_test_id" bigint;

alter table "public"."tests" add column "compose_tournament_id" bigint;

CREATE UNIQUE INDEX problems_compose_problem_id_key ON public.problems USING btree (compose_problem_id);

CREATE UNIQUE INDEX tests_compose_test_id_key ON public.tests USING btree (compose_test_id);

CREATE UNIQUE INDEX unique_test_problem ON public.test_problems USING btree (test_id, problem_id);

alter table "public"."problems" add constraint "problems_compose_problem_id_key" UNIQUE using index "problems_compose_problem_id_key";

alter table "public"."test_problems" add constraint "unique_test_problem" UNIQUE using index "unique_test_problem";

alter table "public"."tests" add constraint "tests_compose_test_id_key" UNIQUE using index "tests_compose_test_id_key";

CREATE UNIQUE INDEX test_and_problem_id_unique ON public.test_problems USING btree (test_id, problem_id);

alter table "public"."test_problems" add constraint "test_and_problem_id_unique" UNIQUE using index "test_and_problem_id_unique";

create policy "Host admins can do anything to problem images" on storage.objects as permissive for all to authenticated using (bucket_id = 'problem-images' and (EXISTS ( SELECT 1
   FROM host_admins
  WHERE (((host_admins.host_id)::text = regexp_replace(name, 'host([^/]+)/.*'::text, '\1'::text)) AND (host_admins.admin_id = auth.uid()) AND host_admins.owner)))); 