-- Alter the ticket_service_enum type to add 'admin' as a valid option
ALTER TYPE ticket_service_enum ADD VALUE IF NOT EXISTS 'admin';

-- Update the default TypeScript types with the new changes (this comment is just a reminder)
-- After running this migration, run "npm run update-types" to update the TypeScript types
