create type ticket_service_enum as enum ('stripe', 'eventbrite');

alter table public.ticket_orders 
add column ticket_service ticket_service_enum not null default 'stripe'::ticket_service_enum;
