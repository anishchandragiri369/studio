-- Add image column to fruit_bowls table to support dynamic image loading
-- This enables consistent image handling for fruit bowls like we have for juices

-- Add the image column
ALTER TABLE fruit_bowls 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Update all existing fruit bowls to use the default image
UPDATE fruit_bowls 
SET image = '/images/fruit-bowl-custom.jpg' 
WHERE image IS NULL OR image = '';

-- Add a comment to document the purpose
COMMENT ON COLUMN fruit_bowls.image IS 'Image path for the fruit bowl, used in UI components';

-- Optional: Add a check constraint to ensure valid image paths
ALTER TABLE fruit_bowls 
ADD CONSTRAINT check_fruit_bowl_image_format 
CHECK (image IS NULL OR image LIKE '/images/%' OR image LIKE 'https://%' OR image LIKE 'http://%');
