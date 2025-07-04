# Deployment Instructions for Custom Ranking Lists Feature

## Database Migration Required

The custom ranking lists feature requires database schema changes. After deployment, you need to run the following SQL migration on your production database:

### For Neon Database (Main Database)

1. Go to your Neon dashboard
2. Open the SQL editor for your database
3. Run the SQL from: `/prisma/migrations/manual_custom_ranking_lists.sql`

### For Orchestra-specific Databases (SCO, SCOSO)

If you're using the multi-database architecture, you'll also need to run the same migration on each orchestra's database:

1. For SCO: Run the migration on the SCO Supabase database
2. For SCOSO: Run the migration on the SCOSO Supabase database

### Verification

After running the migrations, verify that:
- The `/api/projects` endpoint returns 200 status
- You can create new project needs
- The custom ranking list feature works as expected

### Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove foreign key constraints
ALTER TABLE "ProjectNeed" DROP CONSTRAINT IF EXISTS "ProjectNeed_customRankingListId_fkey";
ALTER TABLE "CustomRanking" DROP CONSTRAINT IF EXISTS "CustomRanking_musicianId_fkey";
ALTER TABLE "CustomRanking" DROP CONSTRAINT IF EXISTS "CustomRanking_customListId_fkey";
ALTER TABLE "CustomRankingList" DROP CONSTRAINT IF EXISTS "CustomRankingList_positionId_fkey";
ALTER TABLE "CustomRankingList" DROP CONSTRAINT IF EXISTS "CustomRankingList_projectId_fkey";

-- Remove columns from ProjectNeed
ALTER TABLE "ProjectNeed" 
DROP COLUMN IF EXISTS "customRankingListId",
ALTER COLUMN "rankingListId" SET NOT NULL;

-- Drop tables
DROP TABLE IF EXISTS "CustomRanking";
DROP TABLE IF EXISTS "CustomRankingList";
```

## Environment Variables

No new environment variables are required for this feature.

## Testing After Deployment

1. Log in to the admin panel
2. Navigate to a project
3. Click "Lägg till behov"
4. Select an instrument and position
5. Click "Skapa ny lista" link
6. Verify the custom list creation page loads correctly
7. Create a test custom list and save it
8. Complete the need creation with the custom list
9. Verify the custom list name appears in the project view