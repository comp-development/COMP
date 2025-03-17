alter table "public"."problems" add column "host_id" bigint;

alter table "public"."problems" enable row level security;

alter table "public"."problems" add constraint "problems_host_id_fkey" FOREIGN KEY (host_id) REFERENCES hosts(host_id) not valid;

alter table "public"."problems" validate constraint "problems_host_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_test_problem_host_match()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If there is no match between the problem's host and the test's event host, raise an error
  IF NOT EXISTS (
    SELECT 1 
    FROM public.problems p
    JOIN public.tests t ON t.test_id = NEW.test_id
    JOIN public.events e ON t.event_id = e.event_id
    WHERE p.problem_id = NEW.problem_id AND p.host_id = e.host_id
  ) THEN
    RAISE EXCEPTION 'The problem and test must belong to the same host';
  END IF;
  RETURN NEW;
END;
$function$
;

create policy "host_admins_can_do_anything"
on "public"."problems"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM host_admins
  WHERE ((host_admins.host_id = problems.host_id) AND (host_admins.admin_id = auth.uid())))));


CREATE TRIGGER enforce_test_problem_host_match BEFORE INSERT OR UPDATE ON public.test_problems FOR EACH ROW EXECUTE FUNCTION check_test_problem_host_match();



