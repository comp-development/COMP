-- Add ordering column to addons table
ALTER TABLE \"public\".\"addons\" ADD COLUMN \"ordering\" INTEGER NOT NULL DEFAULT 0
