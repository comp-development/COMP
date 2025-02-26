alter table "public"."events" add column "ticket_price_cents" bigint;
update "public"."events" set "ticket_price_cents" = 0 where "ticket_price_cents" is null;
alter table "public"."events" alter column "ticket_price_cents" set not null;
