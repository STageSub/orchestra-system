# System Architecture

## Overview

The Orchestra Substitute Request System is built using a modern web application architecture with Next.js 15 as the full-stack framework.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Next.js 15 App Router (React)              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │   Pages      │  │  Components  │  │   Hooks  │  │   │
│  │  │  (app/*)     │  │ (components/)│  │  (Custom)│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  │                    Tailwind CSS                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Layer (app/api/*)                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │  Musicians   │  │  Rankings    │  │Instruments│  │   │
│  │  │   Routes     │  │   Routes     │  │  Routes  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Prisma ORM                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │    Schema    │  │   Client     │  │   Types  │  │   │
│  │  │(schema.prisma)│ │ (lib/prisma) │  │(Generated)│ │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            PostgreSQL (Supabase)                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │   14 Tables  │  │  Relations   │  │ Indexes  │  │   │
│  │  │              │  │              │  │          │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack Details

### Frontend Layer
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **@dnd-kit**: Drag and drop functionality
- **React Hooks**: State management and side effects

### API Layer
- **Next.js API Routes**: Serverless functions
- **RESTful Design**: Standard HTTP methods
- **Error Handling**: Consistent error responses
- **Validation**: Input validation on all endpoints

### Data Layer
- **Prisma**: Type-safe ORM
- **PostgreSQL**: Relational database
- **Supabase**: Managed PostgreSQL hosting
- **Transactions**: ACID compliance for critical operations

## Key Design Patterns

### 1. Repository Pattern
Although not explicitly implemented, Prisma acts as a repository layer, abstracting database operations.

### 2. Component Composition
React components are built using composition for reusability:
```typescript
<AdminLayout>
  <PageHeader />
  <DataTable>
    <TableRow />
  </DataTable>
</AdminLayout>
```

### 3. Optimistic UI Updates
UI updates immediately while API calls happen in background:
```typescript
// Update UI immediately
setMusicians(updatedMusicians)
// Then sync with server
await updateMusician(id, data)
```

### 4. Server Components (Next.js 15)
Pages are server components by default, with client components marked explicitly:
```typescript
'use client'  // Only when needed for interactivity
```

## Data Flow

### Read Operations
1. User navigates to page
2. Server component fetches data
3. Or client component calls API endpoint
4. API route queries database via Prisma
5. Data returned and rendered

### Write Operations
1. User interacts with UI
2. Client-side validation
3. API call with optimistic update
4. Server-side validation
5. Database transaction via Prisma
6. Success/error response
7. UI sync if needed

## Security Considerations

### Current Implementation
- Input validation on all forms
- SQL injection prevention via Prisma
- XSS prevention via React
- CSRF protection via Next.js

### Future Enhancements
- Authentication (Supabase Auth planned)
- Role-based access control
- API rate limiting
- Audit logging

## Performance Optimizations

### Implemented
- Component code splitting
- Optimistic UI updates
- Efficient database queries
- Proper indexing

### Planned
- Redis caching layer
- Image optimization
- API response compression
- Database query optimization

## Scalability

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- Serverless deployment ready

### Vertical Scaling
- Efficient queries with Prisma
- Pagination on large datasets
- Lazy loading where appropriate

## Deployment Architecture

### Development
```
Local Development
    │
    ├── Next.js Dev Server (localhost:3000)
    └── Local PostgreSQL or Supabase
```

### Production (Recommended)
```
Vercel (Frontend + API)
    │
    ├── Edge Functions (API Routes)
    ├── Static Assets (CDN)
    └── Supabase (Database)
```

## Database Schema Highlights

### Key Relationships
1. **Musicians ↔ Qualifications**: Many-to-many through MusicianQualification
2. **Positions ↔ Instruments**: Many-to-one relationship
3. **RankingLists ↔ Musicians**: Many-to-many with position tracking
4. **Projects ↔ Requests**: One-to-many (future implementation)

### Data Integrity
- Foreign key constraints
- Cascade deletes where appropriate
- Unique constraints on IDs
- Check constraints for valid data

## Development Workflow

### Local Development
1. `npm run dev` - Start development server
2. Hot reloading for instant feedback
3. TypeScript checking in IDE
4. Prisma Studio for database inspection

### Code Organization
```
app/              # Next.js app directory
├── admin/        # Admin pages
├── api/          # API routes
└── (public)/     # Public pages

components/       # Reusable components
lib/             # Utilities and helpers
prisma/          # Database schema
public/          # Static assets
```

### Testing Strategy (Future)
- Unit tests for utilities
- Integration tests for API
- E2E tests for critical flows
- Performance testing

## Monitoring & Logging (Future)

### Application Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics

### Infrastructure Monitoring
- Database performance
- API response times
- Resource utilization

## Conclusion

The architecture is designed to be:
- **Scalable**: Can grow with the organization
- **Maintainable**: Clear separation of concerns
- **Performant**: Optimized for user experience
- **Secure**: Built with security in mind
- **Flexible**: Easy to extend and modify