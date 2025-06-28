# Comprehensive Test Guide for Orchestra Request System

This guide provides step-by-step instructions for testing all three request strategies in the Orchestra System. Each strategy has unique behaviors that need to be tested thoroughly.

## Prerequisites

1. Create test musicians with emails you can access
2. Set up email templates (use seed function if needed)
3. Create a test project with multiple needs
4. Ensure FORCE_REAL_EMAILS=true in .env.local for real email testing

## Test Strategy 1: Sequential (Sekventiell)

### Description
Sends requests one at a time, waiting for each response before sending to the next musician.

### Test Steps

1. **Setup**
   - Create a need with:
     - Quantity: 2
     - Strategy: Sequential
     - Ranking list with 5+ musicians
     - Response time: 24 hours

2. **Initial Request**
   - Click "Skicka förfrågningar"
   - Verify only ONE email is sent to the first musician
   - Check progress bar shows 0/2 accepted, 1 pending

3. **Decline Scenario**
   - First musician clicks "Nej"
   - Verify:
     - Request automatically sent to second musician
     - Progress bar still shows 0/2 accepted, 1 pending
     - First musician marked as declined in hover tooltip

4. **Accept Scenario**
   - Second musician clicks "Ja"
   - Verify:
     - Confirmation email sent
     - Request automatically sent to third musician
     - Progress bar shows 1/2 accepted, 1 pending

5. **Completion**
   - Third musician clicks "Ja"
   - Verify:
     - Progress bar shows 2/2 (fully staffed)
     - No more requests are sent
     - Need status changes to "Färdig"

### Edge Cases to Test
- Timeout handling (use test page to trigger timeout)
- All musicians decline (should exhaust the list)
- Pause/resume during active request

## Test Strategy 2: Parallel (Parallell)

### Description
Maintains active requests equal to the number needed. Sends new requests immediately when musicians decline.

### Test Steps

1. **Setup**
   - Create a need with:
     - Quantity: 3
     - Strategy: Parallel
     - Ranking list with 6+ musicians
     - Response time: 48 hours

2. **Initial Request**
   - Click "Skicka förfrågningar"
   - Verify THREE emails sent simultaneously
   - Progress bar shows 0/3 accepted, 3 pending

3. **Mixed Responses**
   - First musician: Accept
     - Verify: 1/3 accepted, 2 pending (no new request)
   - Second musician: Decline
     - Verify: Request sent to 4th musician immediately
     - Still shows 1/3 accepted, 2 pending
   - Third musician: Accept
     - Verify: 2/3 accepted, 1 pending (no new request)

4. **Completion**
   - Fourth musician: Accept
   - Verify:
     - Progress bar shows 3/3 (fully staffed)
     - All pending requests remain pending (not cancelled)

### Edge Cases to Test
- Multiple declines in quick succession
- Accept responses that exceed quantity needed
- Insufficient musicians in ranking list

## Test Strategy 3: First Come, First Served (Först till kvarn)

### Description
Sends to a fixed number of musicians at once. First to accept get the positions. No refills on declines.

### Test Steps

1. **Setup with maxRecipients**
   - Create a need with:
     - Quantity: 2
     - Strategy: First Come
     - maxRecipients: 4
     - Ranking list with 6+ musicians

2. **Initial Request**
   - Click "Skicka förfrågningar"
   - Verify FOUR emails sent (maxRecipients)
   - Progress bar shows 0/2 accepted, 4 pending

3. **Decline Handling**
   - First musician: Decline
   - Verify:
     - NO new request sent
     - Progress shows 0/2 accepted, 3 pending

4. **First Accept**
   - Second musician: Accept
   - Verify:
     - Confirmation email sent
     - Progress shows 1/2 accepted, 2 pending
     - Other requests still active

5. **Position Filled**
   - Third musician: Accept
   - Verify:
     - All remaining pending requests cancelled
     - "Position filled" email sent to pending musicians
     - Progress shows 2/2 (fully staffed)

### Test with No maxRecipients

1. **Setup**
   - Create need with maxRecipients: null
   - 10 musicians in ranking list

2. **Test**
   - Click "Skicka förfrågningar"
   - Verify ALL 10 musicians receive emails
   - First 2 to accept get positions
   - All others receive "position filled" emails

### Edge Cases to Test
- maxRecipients less than quantity (should show error)
- Simultaneous accepts that exceed quantity
- All musicians decline (no refills)

## Common Test Scenarios

### 1. File Attachments
- Upload files with "Vid förfrågan" timing
- Verify files attached to request emails
- Upload files with "Vid accept" timing  
- Verify files only attached to confirmation emails

### 2. Email Template Variables
- Check all variables are replaced correctly:
  - {{musicianName}}, {{projectName}}, {{position}}
  - {{startDate}}, {{weekNumber}}
  - {{rehearsalSchedule}}, {{concertInfo}}

### 3. Pause/Resume Functionality
- Pause active need
- Verify no new requests sent on decline
- Resume and verify normal behavior returns

### 4. Progress Bar Hover Information
- Hover over progress bar
- Verify sections appear for:
  - Pending (yellow)
  - Accepted (green)
  - Declined (red)
  - Timed out (gray)
  - Next in queue (if applicable)

### 5. Token Expiration
- Set short response time (1 hour)
- Wait for expiration
- Verify late response shows "Token expired" message

## Using the Test Requests Page (/admin/test-requests)

The test page allows you to:

1. **Create Test Requests**
   - Select project and need
   - Click "Skapa test-förfrågan"
   - Use different response times for testing

2. **Simulate Responses**
   - Click "Simulera JA" or "Simulera NEJ"
   - Verify strategy-specific behavior

3. **Trigger Time Events**
   - "Kör påminnelser" - Send reminders for old requests
   - "Kör timeouts" - Force timeout expired requests

4. **Preview Emails**
   - Click eye icon to see email content
   - Verify template rendering and variables

5. **Clear Test Data**
   - Use "Rensa testdata" to start fresh
   - Only affects test requests

## Troubleshooting

### Emails Not Sending
- Check RESEND_API_KEY is set
- Verify FORCE_REAL_EMAILS=true
- Check Resend dashboard for errors
- Ensure domain is verified (stagesub.com)

### Strategy Not Working as Expected
- Check need configuration (quantity, maxRecipients)
- Verify ranking list has enough musicians
- Check musician availability (active status)
- Review request logs in database

### File Attachments Missing
- Verify files exist in /public/uploads/projects/
- Check sendTiming matches expected behavior
- Ensure file size under 10MB
- Total email size must be under 40MB

### Token Issues
- Check NEXT_PUBLIC_APP_URL is correct
- Verify token hasn't been used
- Check expiration based on responseTimeHours
- Ensure database has token record

## Best Practices

1. **Test Data Management**
   - Use consistent naming (e.g., "TEST - Project Name")
   - Clean up test data regularly
   - Use separate ranking lists for testing

2. **Email Testing**
   - Use email addresses you control
   - Consider using email aliases (user+test1@domain.com)
   - Monitor Resend dashboard for delivery status

3. **Systematic Testing**
   - Test one strategy at a time
   - Document any issues found
   - Verify both happy path and edge cases
   - Test with Swedish characters (å, ä, ö)

4. **Performance Testing**
   - Test with large ranking lists (50+ musicians)
   - Send multiple needs simultaneously
   - Monitor response times and timeouts