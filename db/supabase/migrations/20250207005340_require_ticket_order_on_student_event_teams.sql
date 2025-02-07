alter table "public"."ticket_orders" drop constraint "single_order_per_student_or_org";

drop index if exists "public"."single_order_per_student_or_org";

CREATE UNIQUE INDEX single_order_per_student ON public.ticket_orders USING btree (event_id, student_id) NULLS NOT DISTINCT;

alter table "public"."ticket_orders" add constraint "single_order_per_student" UNIQUE using index "single_order_per_student";

-- set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.student_team_requirements(in_student_id uuid, in_team_id bigint, in_org_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    v_associated_team_org_id bigint;
    v_associated_t_o_quantity bigint;
    v_associated_t_o_org_id bigint;
    v_associated_t_o_student_id uuid;
    v_org_occupied_tickets bigint;
    v_org_available_tickets bigint;
    v_event_id bigint;
    v_associated_o_e_org_id bigint;
begin

  select teams.team_id, teams.org_id into v_event_id, v_associated_team_org_id
  from teams where teams.team_id = in_team_id;

  -- if the student is not on a team, there's nothing else to check
  if in_team_id is null then
    return true;
  end if;

  -- if the student is on an org team, then they must have org_id in the student_events row
  if not exists(select 1 from teams WHERE teams.org_id = in_org_id and teams.team_id = in_team_id) then
    raise 'No matching team with the same org id';
  end if;


  -- if a student is on an independent team, then they must have paid for their own ticket
  -- note that we don't check whether or not the ticket order is completed. this is checked
  -- on insertion into a team by API code.
  if  v_associated_team_org_id is null then
    select quantity into v_associated_t_o_quantity
    from ticket_orders
    where ticket_orders.student_id = in_student_id;
    if v_associated_t_o_quantity = 1 then
      return true;
    else
      raise 'Student must purchase ticket to be on independent team';
    end if;
  end if;

  -- check that the sum of org ticket_order quantities is at least the count
  -- of students in that org's teams
  select SUM(quantity) from ticket_orders where org_id = v_associated_team_org_id
  into v_org_available_tickets;

  select COUNT(*) from student_events
  inner join teams on student_events.team_id = teams.team_id
  where teams.org_id = v_associated_team_org_id
  into v_org_occupied_tickets;

  if v_org_available_tickets >= v_org_occupied_tickets then
    return true;
  else
    raise 'Organization has not paid for sufficient tickets';
  end if;

end;
$function$
;

alter table "public"."student_events" add constraint "student_team_requirements" CHECK (student_team_requirements(student_id, team_id, org_id)) not valid;

alter table "public"."student_events" validate constraint "student_team_requirements";
