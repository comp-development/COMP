create type "public"."test_event" as enum ('focus', 'keypress', 'paste', 'blur', 'visibility_change');

create table "public"."test_logs" (
    "id" bigint generated by default as identity not null,
    "test_taker_id" bigint not null,
    "event_type" test_event not null,
    "data" text not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."test_logs" enable row level security;

CREATE UNIQUE INDEX test_logs_pkey ON public.test_logs USING btree (id);

alter table "public"."test_logs" add constraint "test_logs_pkey" PRIMARY KEY using index "test_logs_pkey";

alter table "public"."test_logs" add constraint "test_logs_test_taker_id_fkey" FOREIGN KEY (test_taker_id) REFERENCES test_takers(test_taker_id) not valid;

alter table "public"."test_logs" validate constraint "test_logs_test_taker_id_fkey";

grant delete on table "public"."test_logs" to "anon";

grant insert on table "public"."test_logs" to "anon";

grant references on table "public"."test_logs" to "anon";

grant select on table "public"."test_logs" to "anon";

grant trigger on table "public"."test_logs" to "anon";

grant truncate on table "public"."test_logs" to "anon";

grant update on table "public"."test_logs" to "anon";

grant delete on table "public"."test_logs" to "authenticated";

grant insert on table "public"."test_logs" to "authenticated";

grant references on table "public"."test_logs" to "authenticated";

grant select on table "public"."test_logs" to "authenticated";

grant trigger on table "public"."test_logs" to "authenticated";

grant truncate on table "public"."test_logs" to "authenticated";

grant update on table "public"."test_logs" to "authenticated";

grant delete on table "public"."test_logs" to "service_role";

grant insert on table "public"."test_logs" to "service_role";

grant references on table "public"."test_logs" to "service_role";

grant select on table "public"."test_logs" to "service_role";

grant trigger on table "public"."test_logs" to "service_role";

grant truncate on table "public"."test_logs" to "service_role";

grant update on table "public"."test_logs" to "service_role";

create policy "anyone may insert"
on "public"."test_logs"
as permissive
for insert
to public
with check (true);

