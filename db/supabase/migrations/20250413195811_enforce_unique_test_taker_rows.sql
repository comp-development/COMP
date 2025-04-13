CREATE UNIQUE INDEX single_student_test_taker_row ON public.test_takers USING btree (student_id, test_id);

CREATE UNIQUE INDEX single_team_test_taker_row ON public.test_takers USING btree (team_id, test_id);

alter table "public"."test_takers" add constraint "single_student_test_taker_row" UNIQUE using index "single_student_test_taker_row";

alter table "public"."test_takers" add constraint "single_team_test_taker_row" UNIQUE using index "single_team_test_taker_row";

