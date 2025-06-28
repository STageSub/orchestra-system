-- First, update any NULL displayOrder values based on standard orchestra order
UPDATE "Instrument" 
SET "displayOrder" = CASE 
    WHEN LOWER("name") LIKE '%violin%' AND LOWER("name") NOT LIKE '%2%' THEN 1
    WHEN LOWER("name") LIKE '%viola%' THEN 2
    WHEN LOWER("name") LIKE '%cello%' THEN 3
    WHEN LOWER("name") LIKE '%kontrabas%' OR LOWER("name") LIKE '%bass%' THEN 4
    WHEN LOWER("name") LIKE '%flöjt%' OR LOWER("name") LIKE '%flute%' THEN 5
    WHEN LOWER("name") LIKE '%oboe%' THEN 6
    WHEN LOWER("name") LIKE '%klarinett%' OR LOWER("name") LIKE '%clarinet%' THEN 7
    WHEN LOWER("name") LIKE '%fagott%' OR LOWER("name") LIKE '%bassoon%' THEN 8
    WHEN LOWER("name") LIKE '%horn%' THEN 9
    WHEN LOWER("name") LIKE '%trumpet%' THEN 10
    WHEN LOWER("name") LIKE '%trombon%' THEN 11
    WHEN LOWER("name") LIKE '%tuba%' THEN 12
    WHEN LOWER("name") LIKE '%pukor%' OR LOWER("name") LIKE '%timpani%' THEN 13
    WHEN LOWER("name") LIKE '%slagverk%' OR LOWER("name") LIKE '%percussion%' THEN 14
    WHEN LOWER("name") LIKE '%harpa%' OR LOWER("name") LIKE '%harp%' THEN 15
    WHEN LOWER("name") LIKE '%piano%' THEN 16
    ELSE 999
END
WHERE "displayOrder" IS NULL;

-- Make displayOrder NOT NULL with default
ALTER TABLE "Instrument" ALTER COLUMN "displayOrder" SET NOT NULL;
ALTER TABLE "Instrument" ALTER COLUMN "displayOrder" SET DEFAULT 999;

-- Ensure all current instruments have unique display orders
WITH numbered_instruments AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY "displayOrder", "name") as new_order
    FROM "Instrument"
)
UPDATE "Instrument" i
SET "displayOrder" = ni.new_order
FROM numbered_instruments ni
WHERE i.id = ni.id;