-- Add RENAVAM and chassis to vehicles
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS renavam text,
ADD COLUMN IF NOT EXISTS chassis text;
