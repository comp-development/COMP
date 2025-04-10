-- Drop the duplicate foreign key constraint
-- The error shows two constraints: addon_orders_addon_id_fk and addon_orders_addon_id_fkey
-- We'll keep addon_orders_addon_id_fk and drop addon_orders_addon_id_fkey

ALTER TABLE "public"."addon_orders" DROP CONSTRAINT IF EXISTS "addon_orders_addon_id_fkey";

-- Add an optional description column to the addons table
ALTER TABLE "public"."addons" ADD COLUMN "description" text;

-- Make sure the constraint we're keeping still exists and is valid
ALTER TABLE "public"."addon_orders" VALIDATE CONSTRAINT "addon_orders_addon_id_fk";

-- Comment explaining the migration
COMMENT ON TABLE "public"."addons" IS 'Table for storing add-ons with optional description field';
