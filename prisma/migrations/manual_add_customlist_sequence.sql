-- Add IdSequence entry for customList if it doesn't exist
INSERT INTO "IdSequence" ("entityType", "lastNumber", "updatedAt")
SELECT 'customList', 0, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM "IdSequence" WHERE "entityType" = 'customList'
);