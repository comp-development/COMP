alter table "public"."tests" drop constraint "tests_compose_test_id_key";

drop index if exists "public"."tests_compose_test_id_key";