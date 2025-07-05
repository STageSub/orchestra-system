# Email & SMS Configuration Implementation

## Overview
The orchestra system now supports per-orchestra email and SMS configuration through the superadmin dashboard. Each orchestra can have its own Resend API key for email and Twilio credentials for SMS.

## Implementation Details

### 1. Database Schema Updates

#### Central Database (Neon) - Orchestra Table
```sql
-- Email Configuration
resendApiKey      String?
emailFromAddress  String?  @default("no-reply@stagesub.com")
emailFromName     String?
emailReplyTo      String?

-- SMS Configuration  
twilioAccountSid  String?
twilioAuthToken   String?
twilioFromNumber  String?
smsOnRequest      Boolean  @default(false)
smsOnReminder     Boolean  @default(false)
smsOnConfirmation Boolean  @default(false)
smsOnPositionFilled Boolean @default(false)
smsOnGroupEmail   Boolean  @default(false)
```

### 2. Email Service Updates

The email service (`/lib/email.ts`) now:
- Checks for orchestra-specific Resend API key
- Uses orchestra's custom from address, name, and reply-to
- Falls back to default environment variable if not configured
- Caches Resend instances per orchestra

### 3. SMS Service Implementation

New SMS service (`/lib/sms.ts`) features:
- Twilio integration with per-orchestra credentials
- Automatic SMS sending based on configuration flags
- SMS templates for all email types:
  - Request notifications
  - Reminders
  - Confirmations
  - Position filled notifications
  - Group messages
- Development mode simulation

### 4. UI Updates

The OrchestraConfig component now includes:
- Email configuration section with test functionality
- SMS/Twilio configuration section
- Checkboxes for enabling SMS for different event types
- Visual feedback when Twilio is not configured

### 5. API Endpoints

Updated endpoints:
- `/api/superadmin/orchestras/[id]/config` - GET/PUT orchestra configuration
- `/api/group-email/send` - Now sends SMS when configured

## Usage

### For Superadmins

1. Navigate to Superadmin Dashboard
2. Click on an orchestra
3. Go to "Konfiguration" tab
4. Configure email settings:
   - Add Resend API key (optional)
   - Customize from address and name
   - Set reply-to address
5. Configure SMS settings:
   - Add Twilio Account SID
   - Add Twilio Auth Token
   - Add verified Twilio phone number
   - Enable SMS for desired event types

### For Orchestra Admins

No changes needed - email and SMS will automatically use the configured settings.

## Testing

### Email Testing
1. Configure Resend API key
2. Enter test email address
3. Click "Testa" button
4. Check inbox for test email

### SMS Testing
- SMS will be simulated in development unless `FORCE_REAL_SMS=true`
- Check console logs for simulated SMS messages
- In production, SMS will be sent via Twilio when configured

## Security

- Sensitive data (API keys, tokens) are masked in the UI
- Only superadmins can view/edit configuration
- Credentials are stored encrypted in the database
- Each orchestra's credentials are isolated

## Migration

Run the following SQL in your central database:
```sql
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
```

## Future Enhancements

1. SMS templates customization per orchestra
2. SMS analytics and delivery tracking
3. WhatsApp integration
4. Email template customization in dashboard
5. Bounce handling and unsubscribe management