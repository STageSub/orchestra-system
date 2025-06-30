# Orchestra Substitute Request System (Orkestervikarieförfrågningssystem)


A comprehensive system for managing orchestra musicians, their qualifications, ranking lists, and substitute requests.

## Project Overview

This system is designed to help orchestras manage their musicians and handle substitute requests efficiently. The system includes:

- **Musician Management**: Complete CRUD operations for musicians with qualifications
- **Ranking System**: A/B/C lists for different skill levels with drag-and-drop ranking
- **Instrument Management**: Comprehensive instrument and position management
- **Project Management**: Orchestra projects and productions with file management (Phase 3 - completed)
- **Request System**: Substitute request handling with email templates (Phase 4 - pending)
- **Admin Dashboard**: Analytics and overview (Phase 5 - pending)

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **UI Libraries**: @dnd-kit for drag-and-drop functionality
- **Deployment**: Vercel-ready

## Key Features Implemented

### 1. Musician Management
- Complete CRUD operations for musicians
- Multiple qualification management per musician
- Status tracking (active/inactive/archived)
- Unique musician ID generation (MUS001, MUS002, etc.)
- Contact information management
- **Enhanced Musician Profile** (2025-06-26):
  - Rankings section showing positions in all A/B/C lists
  - Project history with all requests received
  - Comprehensive statistics (acceptance rate, response time, top positions)

### 2. Ranking Lists
- A/B/C list system with optional descriptions
- Drag-and-drop ranking within lists
- Musicians can appear in multiple lists with different rankings
- Add/remove musicians from lists
- Clear entire list with RADERA confirmation
- Inline description editing

### 3. Instrument & Position Management
- Full CRUD for instruments
- Hierarchical position/qualification system
- Drag-and-drop position ordering
- Unique musician counting (no duplicates)
- Inline position editing
- Delete protection (cannot delete if musicians are assigned)

### 4. Project Management
- Full CRUD operations for projects
- Project needs with three request strategies (Sequential, Parallel, First Come)
- File upload system with base64 encoding
- **Enhanced Project Details** (2025-06-26):
  - Two-column layout (info left, needs/requests right)
  - Display rehearsal schedule and concert information
  - Pause/resume functionality for individual needs
  - Grid-based button alignment for consistency

### 5. Dashboard & Statistics (2025-06-26)
- **Dynamic Admin Dashboard**:
  - Real-time statistics from database
  - Total musicians (active/inactive)
  - Active projects and pending responses
  - Response rate for last 30 days
- **API Endpoints**:
  - `/api/dashboard/stats` - Dashboard statistics
  - `/api/musicians/[id]/project-history` - Musician's project history
  - `/api/musicians/[id]/statistics` - Musician statistics

### 6. UI/UX Features
- Responsive design with mobile support
- Red badges for inactive musicians (not entire rows)
- Automatic filtering in musician lists
- Expandable/collapsible sections
- Optimistic UI updates
- Grid layout for consistent button alignment
- Swedish language throughout
- **Staffing percentage indicators** (2025-06-26):
  - Visual progress bars on project cards
  - Color-coded: Green (≥80%), Yellow (≥50%), Red (<50%)
  - Shows exact numbers (accepted/needed)

### 7. Advanced Deletion System
- Cascade deletion support for related entities
- Instruments can be deleted if no musicians (removes positions & lists)
- Positions can be deleted if no musicians (removes ranking lists)
- Ranking lists can be deleted when empty (returns to "+ Skapa lista" state)
- RADERA confirmation for all destructive actions
- Foreign key constraint protection

## Database Schema

The system uses 16 tables with relationships managed by Prisma:

- **Musicians**: Core musician data
- **Instruments**: Orchestra instruments
- **Positions**: Instrument-specific positions/qualifications
- **MusicianQualifications**: Many-to-many relationship
- **RankingLists**: A/B/C lists for each position
- **Rankings**: Musicians in ranking lists with positions
- **Projects**: Orchestra projects (Phase 3)
- **Requests**: Substitute requests (Phase 4)
- **DeletedIds**: Tracks deleted IDs to prevent reuse
- **IdSequence**: Manages sequential ID generation
- And more...

## Important Implementation Details

### ID Management
- IDs are NEVER reused (stored in DeletedIds table)
- All IDs have prefixes: MUS (musicians), INST (instruments), POS (positions), etc.
- Sequential numbering with proper formatting (MUS001, not MUS1)

### Next.js 15 Compatibility
- All API routes use async params: `{ params }: { params: Promise<{ id: string }> }`
- Proper handling of Promise-based params throughout

### Database Conventions
- Tables use UpperCamelCase (requires quotes in raw SQL)
- Proper foreign key relationships with cascade deletes
- Cascade deletions implemented for:
  - Instrument → Position → RankingList → Ranking
  - Position → ProjectNeed → Request
  - Position → ProjectFile
- Transaction support for complex operations

### Security & Validation
- RADERA confirmation for destructive actions
- Cannot delete instruments/positions with assigned musicians
- Proper error messages in Swedish
- Input validation on all forms

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd orchestra-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
   DIRECT_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio for database management

## Project Structure

```
orchestra-system/
├── app/
│   ├── admin/
│   │   ├── musicians/        # Musician management
│   │   ├── rankings/        # Ranking lists
│   │   ├── instruments/     # Instrument management
│   │   └── layout.tsx       # Admin layout
│   ├── api/                 # API routes
│   └── page.tsx            # Landing page
├── components/             # Reusable components
├── lib/                   # Utilities and helpers
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts          # Seed data
└── public/              # Static assets
```

## Project Management Features (Phase 3 - Completed)

### Core Features
- Full CRUD operations for projects
- Project needs management with positions and quantities
- Three request strategies: Sequential, Parallel, First Come First Served
- File upload system with reuse functionality
- Automatic file deduplication in modals
- Orphaned file detection and cleanup

### File System
- Base64 encoding for Next.js 15 compatibility
- Files can be attached to specific needs or as general info
- Default timing: general files → "on_request", sheet music → "on_accept"
- Real-time file refresh after upload
- File count shows unique files, not duplicates

## Known Issues & Solutions

1. **Next.js 15 Params Warning**: Fixed by using `await params` in all API routes
2. **Column Name Mismatch**: Fixed `rankingListId` vs `listId` inconsistency
3. **Duplicate Musician Counting**: Implemented unique counting using Prisma groupBy
4. **Foreign Key Constraints**: Fixed by implementing cascade deletes in Prisma schema
5. **Deletion Blocking**: Resolved by adding onDelete: Cascade to all relevant relations
6. **FormData Parsing Error**: Fixed by using base64 encoding with JSON instead of FormData
7. **Duplicate Files in Modals**: Fixed by deduplicating files by fileUrl using Map

## Recent Updates (2025-06-26)

### Dashboard Implementation ✅
- Dynamic statistics fetching from database
- Real-time data for musicians, projects, requests
- Response rate calculation for last 30 days
- Clean, card-based UI design
- Reordered navigation: "Översikt" now first, "Projekt" second

### Project Details Redesign ✅
- Two-pane responsive layout
- Left pane: Project information, files, notes
- Right pane: Combined needs & requests view
- Grid-based button alignment for consistency
- Pause/resume functionality for individual needs

### Enhanced Musician Profile ✅
- **Rankings Section**: Shows all A/B/C list positions grouped by instrument
- **Project History**: Complete list of all requests with status
- **Statistics**: Acceptance rate, response time, most requested positions

### Project Overview Enhancements ✅
- **Staffing Indicators**: Visual progress bars showing bemanningsgrad
- **Smart Color Coding**: Green/Yellow/Red based on staffing percentage
- **Quick Stats**: Shows accepted/needed count directly on cards

## Future Development (Pending)

### Phase 4: Token-based Response System (Next Priority)
- Generate secure tokens for each request
- Public response pages (no login required)
- Integrate with existing email templates
- Implement request strategies (Sequential, Parallel, First Come)
- Automated reminders and timeouts

### Remaining Phase 5 Tasks
- Project reports (fill rate, time tracking)
- Export functionality (Excel/PDF)
- Communication history log

### Phase 7: SaaS Transformation (Future)
StageSub will eventually be transformed into a multi-tenant SaaS platform. See [SAAS_ROADMAP.md](./SAAS_ROADMAP.md) for detailed plans including:
- Multi-orchestra support with data isolation
- Subscription plans (Solo, Ensemble, Professional, Enterprise)
- Landing page and marketing site
- Usage limits and automatic billing
- Password-protected admin settings

## Contributing

1. Always use the ID generator for new records
2. Follow the existing code style
3. Update documentation for significant changes
4. Test thoroughly before committing
5. Use Swedish for user-facing text

## License

[Add license information]