# Claude Code Assistant Instructions

This document contains important context and guidelines for Claude when working on the Orchestra System project.

## Project Overview

This is an orchestra substitute request system (orkestervikarieförfrågningssystem) built with Next.js 15, TypeScript, Prisma, and PostgreSQL. The system manages musicians, their qualifications, ranking lists, and substitute requests.

## Critical Implementation Rules

### 1. ID Management
- **NEVER reuse IDs** - All deleted IDs are stored in the DeletedIds table
- Always use the `generateUniqueId` function from `/lib/id-generator.ts`
- ID format: PREFIX + 3-digit number (e.g., MUS001, INST001, POS001)
- Prefixes:
  - MUS: Musicians
  - INST: Instruments  
  - POS: Positions
  - PROJ: Projects
  - REQ: Requests
  - TEMP: Templates

### 2. Database Conventions
- Tables use **UpperCamelCase** (e.g., `Musician`, `RankingList`)
- When writing raw SQL, table names must be quoted: `"Musician"`, `"RankingList"`
- Foreign key relationships are properly maintained
- Use transactions for operations that modify multiple tables

### 3. Next.js 15 Compatibility
- All API routes must handle async params:
  ```typescript
  export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    // ... rest of function
  }
  ```
- Never access params directly without await

### 4. Ranking List System
- Lists are named A, B, C (not difficulty levels)
- Each list can have an optional description
- Musicians can appear in multiple lists with different rankings
- Same musician can have different positions in A, B, and C lists
- Ranking positions are specific to each list

### 5. UI/UX Guidelines
- Inactive musicians show **red badges only** (not entire rows)
- All destructive actions require typing "RADERA" to confirm
- Use Swedish for all user-facing text
- Automatic filtering (no explicit filter buttons)
- Musician IDs are only shown on detail pages, not in overviews
- Empty ranking lists can be deleted (returns to "+ Skapa lista" state)
- Delete buttons only show when safe to delete (no dependencies)

### 6. Code Style
- No comments unless explicitly requested
- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Handle errors gracefully with user-friendly messages
- Implement optimistic UI updates where appropriate

### 7. Common React Rendering Issues
- **Mysterious "0" appearing**: Caused by `&&` operator with undefined functions
  - Wrong: `{condition && functionCheck && <Component>}`
  - Correct: `{condition && functionCheck ? <Component> : null}`
  - Always use ternary operator with explicit null

## Request Strategies (CRITICAL)

### Sequential
- One musician at a time
- Wait for response before next
- No maxRecipients

**Example Scenario - Need 3 Violinists:**
1. System sends request to Musician #1 (highest ranked available)
2. Waits for response (e.g., 48 hours)
3. If YES → Positions filled: 1/3, then sends to Musician #2
4. If NO → Sends to Musician #2
5. Process continues until all 3 positions are filled
6. Only ONE active request at any time
7. Total time: Can take days/weeks if many decline

### Parallel  
- Active requests = Number needed (always)
- Formula: Accepted + Pending = Quantity
- On NO → send to next automatically
- On YES → NO new request (reduce active)
- No maxRecipients

**Example Scenario - Need 3 Violinists:**
1. System sends requests to Musicians #1, #2, #3 simultaneously
2. All 3 have active requests at once
3. Musician #2 accepts → Positions filled: 1/3
4. Musician #1 declines → System immediately sends to Musician #4
5. Now active: #3, #4 (maintaining 2 active to fill 2 remaining)
6. Process continues maintaining (Needed - Accepted) active requests
7. Much faster than sequential

### First Come
- Send to X musicians at once (maxRecipients)
- maxRecipients must be >= quantity
- No refill on declines
- First to accept get the positions

**Example Scenario - Need 3 Violinists, maxRecipients = 5:**
1. System sends requests to Musicians #1-#5 simultaneously
2. All 5 receive requests at once
3. Musicians #3, #1, #4 accept (in that order)
4. Positions filled: 3/3 - DONE!
5. Musicians #2, #5 who haven't responded get "position filled" notification
6. No new requests sent even if some decline
7. Risk: If only 2 accept out of 5, need remains unfilled

See `/docs/REQUEST_STRATEGIES.md` for detailed documentation.

## Common Operations

### Adding a New Musician
1. Generate unique ID with `generateUniqueId('musician')`
2. Create musician record
3. Add qualifications if provided
4. Return the created musician

### Managing Ranking Lists
1. Check if musician already exists in the list
2. Use transactions when updating positions
3. Maintain sequential ranking positions
4. Update all affected positions when reordering

### Deleting Records
1. Check for dependent records first (only musicians block deletion)
2. Show appropriate error if dependencies exist
3. Require "RADERA" confirmation for destructive actions
4. Cascade delete handles related records automatically:
   - Deleting instrument → removes positions & ranking lists
   - Deleting position → removes ranking lists
   - Deleting ranking list → removes rankings
5. DeletedIds table exists but is optional for tracking

## Testing Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint checks
- `npm run typecheck` - TypeScript type checking (if available)

## File Structure
```
app/
├── admin/
│   ├── musicians/     # Musician management
│   ├── rankings/      # A/B/C ranking lists
│   ├── instruments/   # Instrument & position management
│   └── layout.tsx     # Admin layout with navigation
├── api/              # API routes
└── page.tsx         # Landing page

components/          # Reusable React components
lib/                # Utilities (ID generator, Prisma client)
prisma/             # Database schema and migrations
```

## UI/UX Conventions

### Layout Principles
1. **Projektvy hierarki**:
   - Globala åtgärder (hela projektet) → vid projektinfo i vänsterkolumnen
   - Individuella åtgärder (specifik position) → vid varje behov i högerkolumnen
   - Tydlig visuell skillnad mellan primära och sekundära knappar

2. **Knappkonsistens**:
   - Alla knappar i samma rad ska ha `h-10` för enhetlig höjd
   - Använd `font-medium` för all knapptext
   - Primära knappar: fylld bakgrund
   - Sekundära knappar: vit bakgrund med ram
   - Åtgärdsknappar i behovstabellen: "Visa", "Pausa", "Skicka" som text
   - Enhetlig storlek: `px-3 py-1` för små textknappar

3. **Tooltips**:
   - Använd `title` attribut för enkel hover-information
   - Föredra tooltips framför statisk hjälptext

4. **Ikoner och placering**:
   - Redigera/ta bort ikoner placeras bredvid objektet de påverkar
   - Dynamiska ikoner baserat på tillstånd (uppladdning vs dokument)
   - Expandera/kollaps ikon centrerad under metadata
   - Ikonsstorlekar: `w-4.5 h-4.5` för huvudikoner, `w-4 h-4` för mindre åtgärder

5. **Marginaler och spacing**:
   - Konsekvent 16px (1rem) padding på alla sidor av innehållsboxar
   - Samma marginal från högerkant som vänsterkant
   - Status badges centrerade både horisontellt och vertikalt
   - Rätt-justerad progress bar och åtgärdsknappar med `pr-4`
   - Tydligt förklara omfattning (hela projektet vs enskild position)

4. **Instrumentordning**:
   - Använd `displayOrder` fältet för konsekvent ordning överallt
   - ReorderInstrumentsModal för att ändra ordning
   - Null-värden sorteras sist (värde 999)

5. **Datum-konsistens**:
   - Använd alltid "Startdatum" istället för "Datum" eller "Period"
   - Konsekvent terminologi genom hela systemet

## Current Implementation Status

### ✅ Completed (Phases 1-5)
- Full musician CRUD with qualifications
- A/B/C ranking list system with drag-and-drop
- Instrument and position management
- Automatic ID generation with prefix system
- Swedish UI with proper error messages
- RADERA confirmation for destructive actions
- Next.js 15 compatibility fixes
- Cascade deletion system for all entities
- Ranking list deletion and recreation
- Foreign key constraint handling
- Project management system with full CRUD
- Project needs with three request strategies
- File upload system with base64 encoding (Next.js 15 compatible)
- File reuse functionality across needs
- Orphaned file management and cleanup
- Real-time file refresh after upload
- Project notes field for additional information
- Intelligent project sorting (upcoming first, completed last)
- Enhanced Information tab with basic info and notes display
- Email template system with CRUD operations
- Template editor with variable support
- Seed function for default templates
- Compact table view without horizontal scrolling

#### Phase 5 - Senaste implementationer (2025-06-26)
- **Dashboard med verklig statistik**
  - Dynamisk hämtning av data från databasen
  - Visar totalt antal musiker, aktiva projekt, väntande svar, svarsfrekvens
  - API endpoint: `/api/dashboard/stats`
- **Förbättrad projekt-detaljvy**
  - Två-kolumns layout (vänster: projektinfo, höger: behov & förfrågningar)
  - Visning av repetitionsschema och konsertinformation
  - Integrerad pausa/återuppta-funktionalitet för behov
  - Grid-baserad knapp-alignment för konsekvent UI
- **Musikerprofil utökad med tre nya sektioner**
  - **Rankningar**: Visar musikerns positioner i A/B/C-listor grupperat per instrument
  - **Projekthistorik**: Lista över alla projekt där musikern fått förfrågningar
  - **Statistik**: Omfattande statistik med acceptansgrad, svarstid, mest efterfrågade positioner
- **Projektöversikt förbättringar**
  - **Bemanningsgrad-indikator**: Visuell progressbar på varje projektkort
  - **Färgkodning**: Grön (≥80%), Gul (≥50%), Röd (<50%) bemanningsgrad
  - **Exakt statistik**: Visar accepterade/behövda antal direkt på korten
  - **Navigation omordnad**: "Översikt" nu först i menyn, sedan "Projekt"

#### Critical Fixes (2025-06-26) - Request Strategy Bugfixes
- **Ranking List Reorder Fix**
  - Implementerade två-stegs transaktion för att undvika unique constraint konflikt
  - Förbättrad error-serialisering med detaljerade felmeddelanden
  - Ökad transaction timeout för pooler connection
- **Parallel Strategy Fix**
  - Ändrade `createAndSendRequest` att returnera boolean för status tracking
  - Implementerade `Promise.allSettled` för parallell exekvering av requests
  - Nu skickas korrekt antal requests direkt vid första försöket
- **First Come Strategy Fix**
  - När maxRecipients är null skickas nu till ALLA tillgängliga musiker
  - Implementerade cancelled-status när tjänst fylls
  - Alla pending requests markeras som cancelled när någon accepterar
- **Test System Alignment**
  - Test-systemet använder nu samma `sendRequests` funktion som produktion
  - Säkerställer identiskt beteende mellan test och produktion
  - Lade till test-svarstider: 1 minut och 3 timmar
- **Token Expiry Fix**
  - Tokens expire based on `responseTimeHours` not fixed 7 days
  - `generateRequestToken` now takes responseTimeHours parameter
  - Reminders reuse existing tokens via `getOrCreateTokenForRequest`

#### Token-Based Response System (2025-06-26) - COMPLETED
- **Token Generation & Validation**
  - Tokens expire based on response time (not fixed 7 days)
  - Same token reused for reminders (using `getOrCreateTokenForRequest`)
  - One-time use with `usedAt` timestamp
- **Response API (`/api/respond`)**
  - GET endpoint validates token and returns request details
  - POST endpoint handles musician responses
  - Strategy-specific logic (cancels pending for first_come)
  - Transaction-based updates for data consistency
- **Public Response Page (`/respond`)**
  - Shows request details from token
  - Accept/Decline buttons with feedback
  - Error handling for invalid/expired tokens

#### Send Requests Button (2025-06-26) - COMPLETED
- **Smart "Skicka förfrågningar" Button**
  - Only shows when needs require requests
  - Checks for paused needs and staffing levels
  - Placed next to Edit button in project view
- **Confirmation Dialog**
  - Lists all positions that will receive requests
  - Shows exact number of spots to fill
  - Prevents double-clicking during send
- **API Endpoint (`/api/projects/[id]/send-requests`)**
  - Processes all project needs in one request
  - Skips paused and fully staffed needs
  - Returns detailed results per position

#### Gruppmail System Enhancements (2025-06-28) - COMPLETED
- **StageSub Branding & Header Improvements**
  - StageSub logo repositioned to sidebar above navigation
  - Header shows centered "StageSub" with elegant typography (font-light, tracking-wider)
  - Clean, professional layout with better visual hierarchy
- **Project Dropdown Enhancements**
  - Week number format: "V. 26 Beethoven 5" instead of just project name
  - Filtered to show only upcoming projects (startDate >= today)
  - Sorted by week number first, then alphabetically
  - Smaller text (text-sm) for better appearance
  - Consistent with project overview page
- **Recipient Hierarchy Sorting**
  - Fixed recipient sorting to respect position hierarchy
  - Sort order: Instrument → Position Hierarchy → Name
  - Ensures proper order (Förste konsertmästare before Andre konsertmästare)
  - Maintains instrument display order from admin settings
- **Rich Text Editor Simplification**
  - Removed complex Quill.js implementation due to React 19 compatibility issues
  - Implemented simple textarea with reliable functionality
  - Plain text input with HTML email output (line breaks preserved)
  - Eliminated formatting complexity for better user experience
- **Visual UX Improvements**
  - Message section shows light grey when no project selected
  - Clear visual indication that project must be selected first
  - Smooth transitions between disabled/enabled states
  - Enhanced user guidance and professional appearance
- **Email Template Updates**
  - Removed personal greeting for group emails (no "Hej [Name]")
  - Line breaks converted to HTML breaks for proper formatting
  - Updated footer: "StageSub Orchestra System"
  - Plain text to clean HTML conversion

### ✅ Email System - PRODUCTION READY 🎯
- **Domain Verification**: stagesub.com fully verified with Resend ✅
- **DNS Configuration**: All required DNS records configured (MX, SPF, DKIM, DMARC) ✅
- **From Address**: no-reply@stagesub.com (professional sender address) ✅
- **External Email Delivery**: Can send to any email address (not limited to test addresses) ✅
- **Automatic Failed Request Handling**: When musicians decline, next musician gets automatic request ✅
- **Dynamic Response Messages**: Different messages for accepted vs declined responses ✅
- **Transaction Performance**: No timeouts, confirmation emails sent post-transaction ✅
- **Manual Testing**: All scenarios tested and verified working ✅

**Status**: 🚀 **FULLY OPERATIONAL IN PRODUCTION**

#### Phase 6 - Latest Implementations (2025-06-27)

#### Phase 7 - UI/UX Improvements (2025-06-28)
- **Project Needs Table Redesign** - COMPLETED ✅
  - Edit/Delete icons moved next to position names for clarity
  - Progress bar moved to first row for immediate visibility
  - All action buttons converted to text for consistency
  - Status badges centered with improved padding
  - Two-row layout: Information (row 1) + Actions (row 2)
  - Consistent margins throughout (16px/1rem on all sides)
  
- **Icon System Updates** - COMPLETED ✅
  - Dynamic expand/collapse icon:
    - Shows upload cloud icon when no files exist
    - Shows document icon when files are uploaded
  - All icons properly sized and aligned
  - Expand icon centered under metadata bullet point
  
- **Button Standardization** - COMPLETED ✅
  - "Visa", "Pausa", "Skicka" as consistent text buttons
  - Same size and styling across all buttons
  - Proper spacing between buttons and from edges
  - Right-aligned action buttons group

#### Phase 6 - Previous Implementations (2025-06-27)
- **File Distribution** - COMPLETED ✅
  - Files marked as "on_request" are attached to initial request emails
  - Files marked as "on_accept" are attached to confirmation emails
  - Base64 encoding for Resend API compatibility
  - Dynamic attachment note based on whether files are included
  - Full integration with email templates

- **Authentication System** - COMPLETED ✅
  - JWT-based admin authentication with jose library
  - Secure login page at `/admin/login`
  - httpOnly cookies for session storage
  - 24-hour session timeout
  - Rate limiting (5 attempts per 15 minutes)
  - Middleware protection for all admin routes
  - Environment variables for production security
  - See `/docs/AUTHENTICATION.md` for full documentation

- **Critical Bugfixes** - COMPLETED ✅
  - Sequential strategy fixed: "fulfilled" → "completed" status
  - Test data clearing now resets ProjectNeed status
  - Date consistency: Always use "Startdatum" 
  - Progress bar shows declined/timeout musicians

- **Documentation Updates** - COMPLETED ✅
  - Created comprehensive test guide (`/docs/TEST_GUIDE.md`)
  - Documented group email feature (`/docs/GROUP_EMAIL_FEATURE.md`)
  - Updated all progress tracking files
  - Created authentication documentation

### 🔄 Pending (Phase 4-5)
- Queue system for email delivery (nice-to-have)
- Group email functionality for accepted musicians (see `/docs/GROUP_EMAIL_FEATURE.md`)

## Email System

### Configuration
- **Provider**: Resend (resend.com)
- **Domain**: stagesub.com (verified)
- **From Address**: Orchestra System <no-reply@stagesub.com>
- **API Key**: Configured in .env.local (RESEND_API_KEY)
- **Force Real Emails**: Set to true for production

### DNS Records Required
```
MX Record:    send.stagesub.com → feedback-smtp.eu-west-1.amazonses.com (Priority: 10)
TXT Record:   send.stagesub.com → v=spf1 include:amazonses.com ~all
TXT Record:   resend._domainkey.stagesub.com → p=MIGfMA0GCSqGSIb... (DKIM key)
TXT Record:   _dmarc.stagesub.com → v=DMARC1; p=none;
```

### Email Templates
- **request**: Initial request to musicians
- **reminder**: Reminder emails for pending requests  
- **confirmation**: Confirmation for accepted requests
- **position_filled**: Notification when position is filled (first_come strategy)

### Template Variables
All templates support these variables:
- `{{firstName}}`, `{{lastName}}` - Musician name
- `{{projectName}}` - Project name
- `{{positionName}}` - Position name
- `{{instrumentName}}` - Instrument name
- `{{startDate}}` - Project start date
- `{{responseUrl}}` - Link to response page
- `{{responseTime}}` - Hours to respond

### Email Flow
1. **Request Sent**: Email with response link sent to musician
2. **Token Generated**: Unique token for each request (expires based on responseTimeHours)
3. **Response Handling**: Token validates and records response
4. **Follow-up Actions**:
   - **Accepted**: Confirmation email sent
   - **Declined**: Next musician automatically contacted (based on strategy)

### Error Handling
- Detailed logging for debugging email failures
- Graceful fallback for missing templates
- Resend API error handling with retries
- Communication logs track all email activity

## File Upload System

### Key Features
- Base64 encoding for Next.js 15 compatibility (avoids FormData parsing issues)
- Files can be uploaded to specific needs or as general project files
- File reuse across multiple needs without duplication
- Automatic file deduplication in reuse modal (groups by fileUrl)
- Orphaned file detection and cleanup
- Default timing: general files → "on_request", sheet music → "on_accept"

### File Management
- Files without projectNeedId are shown in the Files tab
- Orphaned files can be deleted from Files tab or reuse modal
- File count shows unique files, not total associations
- Real-time refresh after upload using refreshTrigger

## Common Issues & Solutions

1. **"params accessed directly" warning**
   - Always use `await params` in API routes
   
2. **"Cannot add musician to list" error**
   - Check column name consistency (listId vs rankingListId)
   
3. **Duplicate musician counting**
   - Use Prisma's groupBy with distinct counting
   
4. **ID formatting issues**
   - Always use generateUniqueId function
   - Never manually create IDs

5. **FormData parsing error in Next.js 15**
   - Use base64 encoding with JSON instead of FormData
   - API endpoint: `/api/projects/[id]/upload` instead of `/files`

6. **Duplicate files in reuse modal**
   - Files are deduplicated by fileUrl using Map
   - Only unique files are shown regardless of usage count

7. **Mysterious "0" appearing in project needs view**
   - Problem: A standalone "0" appears between rows in CompactNeedsView
   - Root cause: When using `&&` with function checks that can be undefined
     - Example: `{need.status?.totalRequests > 0 && onTogglePause && !need.status.isFullyStaffed && (...)`
     - If `onTogglePause` is undefined, the expression returns the last truthy value before it (which is `true` from `totalRequests > 0`)
     - But since `true && undefined` returns `undefined`, and the first part evaluated to a number > 0, it can return 0
   - Solution: 
     - Use ternary operator with explicit null: `condition ? <Component /> : null`
     - Never use `&& functionCheck && <Component>` pattern
     - Always check: `functionCheck ? (condition && <Component>) : null`
   - Fixed locations:
     - Line 284: Pause/Resume button conditional
     - Line 272: Send button conditional

## Important Reminders
- Always check if an ID exists before reusing it
- Use transactions for multi-table operations
- Test with Swedish characters (å, ä, ö)
- Maintain backward compatibility
- Follow the existing code patterns

## Database Connection - IMPORTANT
Currently using **pooler connection** (higher latency ~300-900ms) due to DNS issues with direct connection.
- **Current**: `postgresql://postgres.tckcuexsdzovsqaqiqkr:Kurdistan12@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Preferred**: `postgresql://postgres:Kurdistan12@db.tckcuexsdzovsqaqiqkr.supabase.co:5432/postgres` (lower latency)
- **TODO**: Switch back to direct connection when DNS resolves properly for better performance