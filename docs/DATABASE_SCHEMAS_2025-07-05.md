# Database Schemas Overview - July 5, 2025

This document provides a complete snapshot of the database architecture for the Orchestra System, which uses a multi-tenant architecture with separate databases.

## Architecture Overview

The system uses three different database schemas:

1. **Central Database (Neon)** - Stores superadmin data, orchestra configurations, and cross-orchestra information
2. **Orchestra Databases (Supabase)** - Individual databases for each orchestra containing their musicians, projects, and requests
3. **Local/Legacy Database** - The original schema containing both types of tables (being phased out)

## 1. Central Database Schema (`schema.central.prisma`)

Located on Neon, this database manages all orchestras and their configurations.

### Tables:

#### Orchestra
The main configuration table for each orchestra tenant.

```prisma
model Orchestra {
  id            String   @id @default(cuid())
  orchestraId   String   @unique @default(cuid())
  name          String
  subdomain     String   @unique
  databaseUrl   String?
  status        String   @default("pending")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  contactName   String
  contactEmail  String
  plan          String   @default("medium")
  maxMusicians  Int      @default(200)
  maxProjects   Int      @default(20)
  pricePerMonth Int      @default(4990)
  logoUrl       String?
  
  // Email Configuration
  resendApiKey      String?
  emailFromAddress  String?  @default("no-reply@stagesub.com")
  emailFromName     String?
  emailReplyTo      String?
  
  // SMS Configuration (NEW)
  twilioAccountSid  String?
  twilioAuthToken   String?
  twilioFromNumber  String?
  smsOnRequest      Boolean  @default(false)
  smsOnReminder     Boolean  @default(false)
  smsOnConfirmation Boolean  @default(false)
  smsOnPositionFilled Boolean @default(false)
  smsOnGroupEmail   Boolean  @default(false)
  
  // Feature Toggles
  features          Json?    @default("{}")
  
  // Branding
  primaryColor      String?  @default("#3B82F6")
  secondaryColor    String?  @default("#1E40AF")
  customDomain      String?
  faviconUrl        String?
  
  // API & Integrations
  apiKey            String?  @unique
  webhookUrl        String?
  webhookSecret     String?
  
  users         User[]
}
```

#### User
Cross-orchestra user management with role-based access.

```prisma
model User {
  id                String     @id @default(cuid())
  email             String     @unique
  role              String     @default("user")
  orchestraId       String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  passwordHash      String
  active            Boolean    @default(true)
  username          String     @unique
  lastLogin         DateTime?
  isArchived        Boolean    @default(false)
  localResident     Boolean    @default(false)
  preferredLanguage String?    @default("sv")
  orchestra         Orchestra? @relation(fields: [orchestraId], references: [id], onDelete: Cascade)
}
```

#### Customer
Legacy customer configuration table (being replaced by Orchestra).

```prisma
model Customer {
  id           String   @id @default(cuid())
  name         String
  subdomain    String   @unique
  databaseUrl  String
  status       String   @default("active")
  contactEmail String
  plan         String   @default("small")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

#### SystemLog
Centralized logging for all orchestras.

```prisma
model SystemLog {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  level       String
  category    String
  message     String
  metadata    Json?
  userId      String?
  orchestraId String?
  subdomain   String?
  ip          String?
  userAgent   String?
  requestId   String?
  duration    Int?
}
```

## 2. Orchestra Database Schema (`schema.orchestra.prisma`)

Each orchestra has its own Supabase database with this schema.

### Core Tables:

#### Musician
Musicians available for substitute positions.

```prisma
model Musician {
  id                Int                     @id @default(autoincrement())
  musicianId        String                  @unique @default(cuid())
  firstName         String
  lastName          String
  email             String                  @unique
  phone             String?
  preferredLanguage String?                 @default("sv")
  localResidence    Boolean                 @default(false)
  notes             String?                 @db.Text
  isActive          Boolean                 @default(true)
  isArchived        Boolean                 @default(false)
  archivedAt        DateTime?
  restoredAt        DateTime?
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
  qualifications    MusicianQualification[]
  rankings          Ranking[]
  customRankings    CustomRanking[]
  requests          Request[]
}
```

#### Project
Concert projects requiring substitute musicians.

```prisma
model Project {
  id                Int                 @id @default(autoincrement())
  projectId         String              @unique @default(cuid())
  name              String
  startDate         DateTime
  weekNumber        Int
  rehearsalSchedule String?
  concertInfo       String?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  notes             String?
  projectFiles      ProjectFile[]
  projectNeeds      ProjectNeed[]
  groupEmailLogs    GroupEmailLog[]
  fileStorage       FileStorage[]
  customRankingLists CustomRankingList[]
}
```

#### ProjectNeed
Specific musician needs for a project.

```prisma
model ProjectNeed {
  id                    Int                @id @default(autoincrement())
  projectNeedId         String             @unique @default(cuid())
  projectId             Int
  positionId            Int
  quantity              Int                @default(1)
  rankingListId         Int?
  customRankingListId   Int?
  requestStrategy       String             // "sequential", "parallel", "first_come"
  maxRecipients         Int?
  responseTimeHours     Int?               @default(24)
  requireLocalResidence Boolean            @default(false)
  archivedAt            DateTime?
  status                String             @default("active")
}
```

#### Request
Individual substitute requests sent to musicians.

```prisma
model Request {
  id                Int                @id @default(autoincrement())
  requestId         String             @unique @default(cuid())
  projectNeedId     Int
  musicianId        Int
  status            String             @default("pending") // pending, accepted, declined, cancelled, timeout
  sentAt            DateTime           @default(now())
  reminderSentAt    DateTime?
  respondedAt       DateTime?
  response          String?
  confirmationSent  Boolean            @default(false)
}
```

### Supporting Tables:

- **Instrument** - Musical instruments (Violin, Viola, etc.)
- **Position** - Positions within instruments (Förste konsertmästare, Tutti, etc.)
- **RankingList** - A/B/C ranking lists per position
- **Ranking** - Individual musician rankings
- **EmailTemplate** - Email templates for different events
- **CommunicationLog** - Email/SMS history
- **GroupEmailLog** - Group email tracking
- **FileStorage** - Database-based file storage
- **CustomRankingList** - Custom ranking lists for specific projects
- **Settings** - Orchestra-specific settings

## 3. Local/Legacy Database Schema (`schema.prisma`)

This schema contains both central and orchestra tables and is used for local development. In production:
- Central tables (Orchestra, User, SystemLog) exist only in Neon
- Orchestra tables (Musician, Project, etc.) exist only in individual Supabase databases

## Key Relationships

### Central Database
- Orchestra → Users (one-to-many)
- Each Orchestra has configuration for email/SMS services

### Orchestra Database
- Musician → Qualifications → Positions
- Position → RankingLists → Rankings → Musicians
- Project → ProjectNeeds → Requests → Musicians
- ProjectNeed → Position & RankingList/CustomRankingList

## Recent Changes (July 5, 2025)

1. **SMS Configuration Added to Central Database:**
   - twilioAccountSid, twilioAuthToken, twilioFromNumber
   - Boolean flags for when to send SMS (smsOnRequest, etc.)

2. **Email Service Updated:**
   - Now checks orchestra-specific Resend API key
   - Falls back to environment variable if not configured
   - Supports custom from addresses per orchestra

3. **SMS Service Implemented:**
   - Twilio integration with per-orchestra credentials
   - Automatic SMS sending based on configuration
   - Development mode simulation

## Migration Instructions

### For Central Database (Neon):
```sql
-- Add SMS configuration fields
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

### For Orchestra Databases (Supabase):
No changes needed - all SMS configuration is stored centrally.