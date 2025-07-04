# Custom Ranking List Migration Guide

## Overview
The custom ranking list feature requires new database tables. Until these tables are created, the dropdown will appear empty if there are no standard ranking lists for a position.

## Quick Fix for Production

### Option 1: Run SQL Migration (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/migrate-custom-lists.sql`
4. Run the query
5. Verify tables were created:
   - `CustomRankingList`
   - `CustomRanking`
   - `customRankingListId` column in `ProjectNeed`

### Option 2: Run TypeScript Migration

```bash
cd orchestra-system
npx tsx scripts/migrate-custom-lists.ts
```

### Option 3: Manual Workaround (Temporary)

If you can't run migrations immediately:
1. Go to Admin → Instruments
2. Find "Violin" → "Tutti violin 2"
3. Create standard A, B, and C lists for this position
4. This will make the dropdown show options while waiting for migration

## Verification

After migration, verify it worked:

1. Check if you can see "Skapa ny lista" button
2. Create a custom list
3. Verify it appears in the dropdown under "Anpassade listor"

## Production Deployment Note

The UI fixes are already deployed, but custom lists won't work until the database migration is run on production.

## Database Changes

The migration creates:

```sql
-- CustomRankingList: Stores custom lists per project/position
CustomRankingList
  - id
  - customListId (unique identifier like CLIST001)
  - projectId
  - positionId
  - name (e.g., "V. 29 Beethoven Symphony 5")
  - isTemplate
  - templateName

-- CustomRanking: Junction table for musicians in custom lists
CustomRanking
  - id
  - customListId
  - musicianId
  - rank (ordering within the list)

-- ProjectNeed: Added column
  - customRankingListId (nullable, references CustomRankingList)
```