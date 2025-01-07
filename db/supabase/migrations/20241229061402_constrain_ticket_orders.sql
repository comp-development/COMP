alter table "public"."ticket_orders" add column "order_id" text not null;

CREATE UNIQUE INDEX single_order_per_student_or_org ON public.ticket_orders USING btree (event_id, student_id, org_id) NULLS NOT DISTINCT;

alter table "public"."ticket_orders" add constraint "single_order_per_student_or_org" UNIQUE using index "single_order_per_student_or_org";
