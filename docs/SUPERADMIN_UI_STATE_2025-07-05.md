# Superadmin UI Current State (2025-07-05)

## Overview Tab
Current elements:
- **Stats Grid** (4 cards):
  - Totalt antal orkestrar: 2 (2 aktiva)
  - Totalt antal musiker: Shows aggregated count
  - Totalt antal projekt: Shows aggregated count
  - Månadsintäkter (MRR): Shows total revenue

- **Kunder Table**:
  - Columns: Kund, ID, Musiker, Projekt, Status, Senaste aktivitet, Åtgärder
  - Actions: Öppna, Hantera, Återställ Demo (for SCOSO)
  - Button: "Skapa ny orkester" (top right) → Goes to `/superadmin/orchestras/new`

- **Senaste händelser**:
  - Filter dropdown: "Alla orkestrar" or specific orchestra
  - Shows recent events with severity badges

## Kundhantering Tab (CustomerManagement Component)
- Table with customers from Customer model
- Add/Edit/Delete functionality
- Currently separate from Orchestra model (should be unified)

## Orkestrar Tab (OrchestraManagement Component)
Three cards:
1. **Snabbåtgärder** (Mock - only shows alerts):
   - "Kör migrationer på alla databaser"
   - "Uppdatera alla scheman"
   - "Rensa cache för alla orkestrar"

2. **Databashälsa**:
   - Shows database status for each configured orchestra
   - Status: OK (green) / Fel (red) / Ingen DB (gray)

3. **Systemstatus**:
   - API: Operativ/Fel
   - Databaser: Alla OK/Problem
   - E-post: Aktiv/Fel

- Button: "Ny orkester" → Opens modal (currently mock provisioning)

## Användare Tab (UserManagement Component)
- User table with search functionality
- Columns: Användare, Roll, Orchestra, Status, Skapad, Åtgärder
- Actions: Visa, Redigera, Arkivera/Återställ
- Button: "Lägg till användare" → Opens create user form

## Known UI Issues
1. **Duplicate "Create Orchestra" functionality**:
   - Overview tab button → `/superadmin/orchestras/new` (real page)
   - Orchestras tab button → Modal (mock provisioning)

2. **Mock features showing as real**:
   - Quick Actions buttons
   - Provisioning modal shows progress but doesn't provision

3. **Inconsistent data models**:
   - Customer vs Orchestra confusion
   - Some features use Customer model, others use Orchestra

## Working Features Summary
✅ **Fully Working**:
- Orchestra listing and management
- User CRUD operations
- Database health monitoring
- SCOSO demo reset
- Real-time metrics aggregation

⚠️ **Partially Working**:
- Orchestra provisioning (UI exists but mock)
- Customer management (separate from Orchestra)

❌ **Not Working**:
- Quick Actions (all are mock)
- Actual database provisioning
- Migration running
- Schema updates

## API Response Examples

### /api/superadmin/metrics
```json
{
  "orchestras": [...],
  "metrics": {
    "totalMusicians": 150,
    "activeMusicians": 120,
    "totalProjects": 25,
    "activeProjects": 10,
    "totalRequests": 500,
    "acceptedRequests": 300
  },
  "revenue": {
    "mrr": 14970,
    "currency": "SEK"
  },
  "recentEvents": [...]
}
```

### /api/superadmin/health
```json
{
  "api": "operational",
  "databases": [
    { "name": "Main (Neon)", "status": "healthy" },
    { "name": "Gothenburg Symphony Orchestra", "status": "healthy" },
    { "name": "SCO", "status": "healthy" }
  ],
  "email": "operational"
}
```

---

This document captures the exact UI state and functionality as of 2025-07-05.