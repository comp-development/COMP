-- Add key column to addons table
ALTER TABLE "public"."addons" ADD COLUMN "key" text;

-- Add visible column with default false
ALTER TABLE "public"."addons" ADD COLUMN "visible" boolean NOT NULL DEFAULT false;

-- Rename addon_name to label
ALTER TABLE "public"."addons" RENAME COLUMN "addon_name" TO "label";

-- Add unique constraint on event_id, key, and addon_table combination
CREATE UNIQUE INDEX addons_key_event_id_unique ON public.addons USING btree (event_id, key, addon_table);
ALTER TABLE "public"."addons" ADD CONSTRAINT "addons_key_event_id_unique" UNIQUE USING INDEX "addons_key_event_id_unique";
