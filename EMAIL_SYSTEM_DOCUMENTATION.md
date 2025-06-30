# Email System Documentation - Orchestra System

## Overview
The Orchestra System uses Resend API for email delivery with multi-language support (Swedish/English) based on musician preferences.

## Key Components

### 1. Email Service (`/lib/email.ts`)
- Main email functionality with template support
- Language selection based on `musician.preferredLanguage`
- Attachment support for files (base64 encoded)

### 2. Email Templates
Stored in database with language variants:
- `request` / `request_en` - Initial request to musicians
- `reminder` / `reminder_en` - Reminder emails
- `confirmation` / `confirmation_en` - Acceptance confirmations  
- `position_filled` / `position_filled_en` - Position filled notifications

### 3. Response System (`/api/respond`)
- Token-based validation for email links
- Handles accept/decline responses
- Triggers follow-up actions based on strategy

## Language Selection Logic

```typescript
const language = (musician.preferredLanguage || 'sv') as 'sv' | 'en'
```

1. Check musician's `preferredLanguage` field
2. Default to 'sv' (Swedish) if not set
3. Look for template with language suffix (e.g., `confirmation_en`)
4. Fall back to Swedish template if English not found

## Production vs Development Issue

### The 7-Hour Debug Session Root Cause
Email links ALWAYS point to production URL (https://stagesub.com) even in development:

```
Email sent from localhost → 
Link in email: https://stagesub.com/respond?token=xxx →
User clicks link → 
Production server handles response (not localhost)
```

### Solutions:
1. **For Testing**: Manually change URL to localhost:3001 in browser
2. **For Production**: Deploy all changes before testing email flows
3. **Use Log Viewer**: `/admin/logs` shows real-time logs (development only)

## Testing Email System

### Local Development Testing

1. **Using Log Viewer** (`/admin/logs`):
   - "Test Confirmation Email" - Sends test email with logs
   - "Test Full Flow" - Automatic request → accept → confirmation
   - Shows detailed language selection logs

2. **Manual Testing**:
   - Send request through UI
   - Copy token from email
   - Change URL to `http://localhost:3001/respond?token=xxx`
   - Accept/decline to see local logs

### Production Testing

1. Deploy all changes to production first
2. Test with real email flows
3. Check Vercel logs for debugging

## File Attachments

Files can be attached based on timing:
- `on_request` - Attached to initial request email
- `on_accept` - Attached to confirmation email

Files are base64 encoded for Resend compatibility.

## Common Issues & Solutions

### Issue 1: Emails Always in Swedish
**Cause**: Production server doesn't have latest code
**Solution**: Deploy changes to production

### Issue 2: No Logs Showing
**Cause**: Logs only exist on the server handling the request
**Solution**: Check if request went to production instead of localhost

### Issue 3: Language Not Working
**Check**:
1. Musician has `preferredLanguage` set
2. English template exists in database
3. Code is deployed to production

## Email Flow Diagram

```
1. Request Sent
   ├─ Generate token
   ├─ Select template based on language
   ├─ Attach files (on_request)
   └─ Send email

2. Musician Clicks Link
   ├─ Validate token
   ├─ Show response page
   └─ Handle response

3. Response Processed
   ├─ If Accepted:
   │   ├─ Send confirmation (with language)
   │   ├─ Attach files (on_accept)
   │   └─ Update project status
   └─ If Declined:
       └─ Send to next musician (based on strategy)
```

## Environment Variables

```env
RESEND_API_KEY=your_api_key
NEXT_PUBLIC_APP_URL=https://stagesub.com
FORCE_REAL_EMAILS=true  # For production
```

## Debugging Tips

1. **Always check environment**: Is the request handled by localhost or production?
2. **Use extensive logging**: Add console.error with emojis for visibility
3. **Test full flow**: Don't just test individual functions
4. **Deploy first**: For production issues, deploy fixes before testing
5. **Check language field**: Ensure musician has preferredLanguage set

## Recent Fixes (2025-06-30)

1. **Language Variable Initialization**: Moved declaration before use
2. **Parameter Order**: Fixed sendTemplatedEmail calls with attachments
3. **Production Deployment**: Pushed all 168 files to ensure consistency
4. **Log System**: Created real-time viewer for debugging

## Maintenance

- Keep English templates synchronized with Swedish versions
- Test both languages when updating templates
- Monitor Resend dashboard for delivery issues
- Regular testing of full email flow