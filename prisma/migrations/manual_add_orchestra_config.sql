-- Add email configuration fields
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "resendApiKey" TEXT,
ADD COLUMN IF NOT EXISTS "emailFromAddress" TEXT DEFAULT 'no-reply@stagesub.com',
ADD COLUMN IF NOT EXISTS "emailFromName" TEXT,
ADD COLUMN IF NOT EXISTS "emailReplyTo" TEXT;

-- Add feature toggles
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "features" JSONB DEFAULT '{}';

-- Add branding fields
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS "customDomain" TEXT,
ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;

-- Add API & Integration fields
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "apiKey" TEXT,
ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT,
ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT;

-- Add unique constraint for apiKey
CREATE UNIQUE INDEX IF NOT EXISTS "Orchestra_apiKey_key" ON "Orchestra"("apiKey");

-- Update existing orchestras with default features
UPDATE "Orchestra" 
SET "features" = '{
  "enableGroupEmail": true,
  "enableFileSharing": true,
  "enableCustomBranding": false,
  "enableApiAccess": false,
  "enableWebhooks": false
}'::jsonb
WHERE "features" IS NULL OR "features" = '{}'::jsonb;