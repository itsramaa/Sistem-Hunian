-- Add photos column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';