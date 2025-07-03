-- Create IdSequence table for SCOSO database
CREATE TABLE IF NOT EXISTS "IdSequence" (
    "id" SERIAL PRIMARY KEY,
    "entityType" TEXT NOT NULL UNIQUE,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on entityType
CREATE UNIQUE INDEX IF NOT EXISTS "IdSequence_entityType_key" ON "IdSequence"("entityType");

-- Insert initial sequences for all entity types
INSERT INTO "IdSequence" ("entityType", "lastNumber") VALUES
    ('musician', 0),
    ('project', 0),
    ('request', 0),
    ('instrument', 0),
    ('position', 0),
    ('rankingList', 0),
    ('ranking', 0),
    ('projectNeed', 0),
    ('emailTemplate', 0),
    ('communicationLog', 0),
    ('projectFile', 0),
    ('auditLog', 0)
ON CONFLICT ("entityType") DO NOTHING;

-- Add update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_idsequence_updated_at BEFORE UPDATE ON "IdSequence"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();