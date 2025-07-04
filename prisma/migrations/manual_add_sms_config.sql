-- Add SMS configuration fields to Orchestra table
ALTER TABLE "Orchestra" 
ADD COLUMN IF NOT EXISTS "twilioAccountSid" TEXT,
ADD COLUMN IF NOT EXISTS "twilioAuthToken" TEXT,
ADD COLUMN IF NOT EXISTS "twilioFromNumber" TEXT,
ADD COLUMN IF NOT EXISTS "smsOnRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "smsOnReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "smsOnConfirmation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "smsOnPositionFilled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "smsOnGroupEmail" BOOLEAN NOT NULL DEFAULT false;