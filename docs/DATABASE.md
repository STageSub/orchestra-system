# Database Documentation

## Overview

The Orchestra System uses PostgreSQL as its database, managed through Prisma ORM. The database is hosted on Supabase and consists of 16 interconnected tables.

## Database Conventions

### Naming Conventions
- **Tables**: UpperCamelCase (e.g., `Musician`, `RankingList`)
- **Columns**: camelCase (e.g., `musicianId`, `createdAt`)
- **Foreign Keys**: [tableName]Id (e.g., `musicianId`, `positionId`)
- **Join Tables**: Combined names (e.g., `MusicianQualification`)

### Important Notes
- When writing raw SQL, table names must be quoted: `"Musician"`, `"RankingList"`
- All tables include `createdAt` and `updatedAt` timestamps
- Soft deletes are preferred (using status fields)

### Cascade Delete Configuration
All foreign key relationships with `onDelete: Cascade`:
- `Position` → `Instrument` (deleting instrument removes positions)
- `RankingList` → `Position` (deleting position removes ranking lists)
- `Ranking` → `RankingList` (deleting list removes rankings)
- `ProjectNeed` → `Position` & `RankingList`
- `ProjectFile` → `Position`
- `Request` → `ProjectNeed`
- `RequestToken` → `Request`
- `CommunicationLog` → `Request`

## Table Schemas

### 1. Musician
Stores core musician information.

```prisma
model Musician {
  id                    Int                        @id @default(autoincrement())
  musicianId            String                     @unique
  name                  String
  email                 String?
  phone                 String?
  status                String                     @default("active")
  notes                 String?
  createdAt             DateTime                   @default(now())
  updatedAt             DateTime                   @updatedAt
  qualifications        MusicianQualification[]
  rankingListMusicians  RankingListMusician[]
  availability          Availability[]
  requests              Request[]
}
```

**Key Points:**
- `musicianId`: Unique identifier (MUS001, MUS002, etc.)
- `status`: active, inactive, or archived
- Supports optional email and phone

### 2. Instrument
Defines orchestra instruments.

```prisma
model Instrument {
  id            Int         @id @default(autoincrement())
  instrumentId  String      @unique
  name          String      @unique
  displayOrder  Int?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  positions     Position[]
}
```

**Key Points:**
- `instrumentId`: Unique identifier (INST001, INST002, etc.)
- `displayOrder`: Controls display sequence in UI
- Each instrument has multiple positions

### 3. Position
Specific positions/roles within an instrument section.

```prisma
model Position {
  id                   Int                      @id @default(autoincrement())
  positionId           String                   @unique
  name                 String
  instrumentId         Int
  hierarchyLevel       Int
  createdAt            DateTime                 @default(now())
  updatedAt            DateTime                 @updatedAt
  instrument           Instrument               @relation(fields: [instrumentId], references: [id])
  qualifications       MusicianQualification[]
  rankingLists         RankingList[]
}
```

**Key Points:**
- `hierarchyLevel`: Defines seniority (1 = highest)
- Linked to specific instrument
- Can have multiple ranking lists (A, B, C)

### 4. MusicianQualification
Many-to-many relationship between musicians and positions.

```prisma
model MusicianQualification {
  id          Int       @id @default(autoincrement())
  musicianId  Int
  positionId  Int
  createdAt   DateTime  @default(now())
  musician    Musician  @relation(fields: [musicianId], references: [id])
  position    Position  @relation(fields: [positionId], references: [id])
  
  @@unique([musicianId, positionId])
}
```

**Key Points:**
- Composite unique constraint prevents duplicates
- Tracks which positions a musician is qualified for

### 5. RankingList
A, B, and C lists for each position.

```prisma
model RankingList {
  id          Int                     @id @default(autoincrement())
  listId      String                  @unique
  positionId  Int
  listType    String                  // "A", "B", or "C"
  description String?
  createdAt   DateTime                @default(now())
  updatedAt   DateTime                @updatedAt
  position    Position                @relation(fields: [positionId], references: [id])
  musicians   RankingListMusician[]
  
  @@unique([positionId, listType])
}
```

**Key Points:**
- `listType`: Only A, B, or C allowed
- `description`: Optional custom description
- One list per type per position

### 6. RankingListMusician
Musicians in ranking lists with their positions.

```prisma
model RankingListMusician {
  id               Int          @id @default(autoincrement())
  listId           Int
  musicianId       Int
  rankingPosition  Int
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  rankingList      RankingList  @relation(fields: [listId], references: [id])
  musician         Musician     @relation(fields: [musicianId], references: [id])
  
  @@unique([listId, musicianId])
  @@unique([listId, rankingPosition])
}
```

**Key Points:**
- `rankingPosition`: Order within the list (1 = top)
- Unique constraints ensure no duplicates and unique positions

### 7. DeletedIds
Tracks all deleted IDs to prevent reuse.

```prisma
model DeletedIds {
  id         Int      @id @default(autoincrement())
  entityType String   // "musician", "instrument", "position", "rankingList", etc.
  deletedId  String
  deletedAt  DateTime @default(now())
  
  @@unique([entityType, deletedId])
  @@index([entityType])
}
```

**Key Points:**
- `entityType`: musician, instrument, position, etc.
- Ensures IDs are never reused
- Added in latest schema update

### 8. IdSequence
Manages sequential ID generation for entities.

```prisma
model IdSequence {
  id         Int      @id @default(autoincrement())
  entityType String   @unique // "musician", "project", "request"
  lastNumber Int      @default(0)
  updatedAt  DateTime @updatedAt
}
```

**Key Points:**
- Tracks the last used number for each entity type
- Ensures sequential ID generation (MUS001, MUS002, etc.)
- Updated automatically when new IDs are generated

### 9. Project (Phase 3 - Not Yet Implemented)
Orchestra projects and productions.

```prisma
model Project {
  id          Int       @id @default(autoincrement())
  projectId   String    @unique
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  status      String    @default("planned")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  requests    Request[]
}
```

### 9. Request (Phase 4 - Not Yet Implemented)
Substitute requests.

```prisma
model Request {
  id              Int       @id @default(autoincrement())
  requestId       String    @unique
  projectId       Int
  positionId      Int
  musicianId      Int?
  status          String    @default("pending")
  requestDate     DateTime
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  project         Project   @relation(fields: [projectId], references: [id])
  musician        Musician? @relation(fields: [musicianId], references: [id])
}
```

### 10. Availability
Musician availability tracking.

```prisma
model Availability {
  id           Int       @id @default(autoincrement())
  musicianId   Int
  date         DateTime
  isAvailable  Boolean   @default(true)
  notes        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  musician     Musician  @relation(fields: [musicianId], references: [id])
  
  @@unique([musicianId, date])
}
```

## Database Relationships

### One-to-Many
- Instrument → Positions
- Position → RankingLists
- Project → Requests

### Many-to-Many
- Musician ↔ Position (through MusicianQualification)
- RankingList ↔ Musician (through RankingListMusician)

## Indexes

Prisma automatically creates indexes for:
- Primary keys (`@id`)
- Unique constraints (`@unique`)
- Foreign keys

Additional indexes can be added for performance:
```prisma
@@index([status])      // For filtering by status
@@index([name])        // For searching by name
@@index([createdAt])   // For date-based queries
```

## Transactions

Critical operations use transactions:

```typescript
// Example: Moving musician between lists
await prisma.$transaction(async (tx) => {
  // Remove from old list
  await tx.rankingListMusician.delete({
    where: { id: oldEntryId }
  })
  
  // Add to new list
  await tx.rankingListMusician.create({
    data: { 
      listId: newListId,
      musicianId,
      rankingPosition: newPosition
    }
  })
})
```

## Migrations

### Development
```bash
# Create migration from schema changes
npx prisma migrate dev --name description_of_change

# Apply migrations
npx prisma migrate dev
```

### Production
```bash
# Deploy migrations
npx prisma migrate deploy
```

### Manual Migrations
For complex data migrations:
```sql
-- Example: Migrating from difficultyLevel to listType
UPDATE "RankingList" 
SET "listType" = CASE 
  WHEN "difficultyLevel" = 'hard' THEN 'A'
  WHEN "difficultyLevel" = 'medium' THEN 'B'
  WHEN "difficultyLevel" = 'easy' THEN 'C'
END;
```

## Best Practices

### 1. Always Use Transactions
For operations affecting multiple tables:
```typescript
const result = await prisma.$transaction([
  prisma.musician.update(...),
  prisma.rankingListMusician.create(...)
])
```

### 2. Efficient Queries
Use includes wisely:
```typescript
// Good: Include only needed relations
const musicians = await prisma.musician.findMany({
  include: {
    qualifications: {
      include: {
        position: {
          include: {
            instrument: true
          }
        }
      }
    }
  }
})
```

### 3. Unique Constraints
Always check for conflicts:
```typescript
try {
  await prisma.musician.create({ data })
} catch (error) {
  if (error.code === 'P2002') {
    // Handle unique constraint violation
  }
}
```

## Maintenance

### Regular Tasks
1. **Backup**: Automated through Supabase
2. **Vacuum**: PostgreSQL auto-vacuum enabled
3. **Index Analysis**: Monitor slow queries
4. **Data Cleanup**: Archive old data periodically

### Performance Monitoring
- Query execution time
- Index usage statistics
- Table size growth
- Connection pool metrics