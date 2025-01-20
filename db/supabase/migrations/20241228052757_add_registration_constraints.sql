alter table "public"."student_teams" alter column "team_id" set not null;

CREATE UNIQUE INDEX student_team_unique ON public.student_teams USING btree (student_id, team_id);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_org_event_pair_exists(in_org_id bigint, in_event_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return (exists (select id from org_events where org_id = in_org_id and event_id = in_event_id));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.student_team_requirements(in_student_id uuid, in_team_id bigint, in_ticket_order_id bigint)
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
    v_event_id bigint;
    v_associated_o_e_org_id bigint;
begin

  select teams.team_id, teams.org_id into v_event_id, v_associated_team_org_id
  from teams
  where teams.team_id = in_team_id;

  select org_id, student_id, quantity into v_associated_t_o_org_id, v_associated_t_o_student_id, v_associated_t_o_quantity
  from ticket_orders
  where ticket_orders.id = in_ticket_order_id;

  select org_events.org_id into v_associated_o_e_org_id
  from student_org_events
  join org_events on org_events.id = student_org_events.org_event_id
  where org_events.event_id = v_event_id and student_org_events.student_id = in_student_id;

  -- the ticket order can be used for at most ticket_orders.quantity
  -- student_teams entries
  select COUNT(*) from student_teams into v_org_occupied_tickets
  where ticket_order_id = in_ticket_order_id;
  if v_org_occupied_tickets > v_associated_t_o_quantity then
    return false;
  end if;

  -- if an org paid for a student to be on a team, then the student MUST be on that org's team
  -- note that a student may have paid for themselves despite being on an org's team
  if v_associated_t_o_org_id is not null then
    if not (v_associated_t_o_org_id = v_associated_team_org_id) then
      return false;
    end if;
  else
  -- otherwise, the student MUST have paid for their own ticket
    if not (in_student_id = v_associated_t_o_student_id) then
      return false;
    end if;
  end if;

  -- if a student is on an org's team,
  if v_associated_team_org_id is not null then
    -- then they MUST have joined the event with that org
    if not (v_associated_team_org_id = v_associated_o_e_org_id) then
      return false;
    end if;
  end if;

  return true;
end;
$function$
;

alter table "public"."student_teams" add constraint "student_team_requirements" CHECK (student_team_requirements(student_id, team_id, ticket_order_id)) not valid;

alter table "public"."teams" add constraint "org_joined_event_for_team" CHECK (((org_id IS NULL) OR check_org_event_pair_exists(org_id, event_id))) not valid;

alter table "public"."student_teams" validate constraint "student_team_requirements";

alter table "public"."student_teams" add constraint "student_team_unique" UNIQUE using index "student_team_unique";

alter table "public"."teams" add constraint "disallow_team_join_code_for_org_teams" CHECK ((((org_id IS NULL) AND (join_code IS NOT NULL)) OR ((org_id IS NOT NULL) AND (join_code IS NULL)))) not valid;

alter table "public"."teams" validate constraint "disallow_team_join_code_for_org_teams";

alter table "public"."teams" validate constraint "org_joined_event_for_team";
