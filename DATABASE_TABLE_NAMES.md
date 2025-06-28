# 📊 Databastabellnamn - Exakt referens

## ⚠️ VIKTIGT: Case Sensitivity

Prisma genererar tabellnamn i **UpperCamelCase** i PostgreSQL. Detta betyder att du MÅSTE använda quotes (`"`) runt tabellnamn i SQL-queries.

## 📋 Alla tabellnamn

| Prisma Model | Tabellnamn i Supabase | Beskrivning |
|--------------|------------------------|-------------|
| Musician | `"Musician"` | Musikerinformation |
| Instrument | `"Instrument"` | Instrumenttyper |
| Position | `"Position"` | Tjänster per instrument |
| MusicianQualification | `"MusicianQualification"` | Kopplar musiker till tjänster |
| RankingList | `"RankingList"` | Rankningslistor |
| Ranking | `"Ranking"` | Musikers position i listor |
| Project | `"Project"` | Projektinformation |
| ProjectNeed | `"ProjectNeed"` | Bemanningsbehov |
| Request | `"Request"` | Förfrågningar |
| RequestToken | `"RequestToken"` | Tokens för svar |
| EmailTemplate | `"EmailTemplate"` | E-postmallar |
| CommunicationLog | `"CommunicationLog"` | Kommunikationshistorik |
| ProjectFile | `"ProjectFile"` | Projektfiler |
| AuditLog | `"AuditLog"` | Ändringshistorik |
| IdSequence | `"IdSequence"` | ID-sekvenser |

## 🔤 Kolumnnamn

Alla kolumnnamn är också i camelCase och kräver quotes:

### Musician
- `"id"` (number)
- `"musicianId"` (string - MUS001, MUS002...)
- `"firstName"` (string)
- `"lastName"` (string)
- `"email"` (string)
- `"phone"` (string | null)
- `"localResidence"` (boolean)
- `"isActive"` (boolean)
- `"isArchived"` (boolean)
- `"archivedAt"` (timestamp | null)
- `"restoredAt"` (timestamp | null)
- `"createdAt"` (timestamp)
- `"updatedAt"` (timestamp)

### MusicianQualification
- `"musicianId"` (number - foreign key)
- `"positionId"` (number - foreign key)

### Position
- `"id"` (number)
- `"positionId"` (string - POS001, POS002...)
- `"instrumentId"` (number - foreign key)
- `"name"` (string)
- `"hierarchyLevel"` (number)

## 📝 SQL Query exempel

### ❌ FEL (fungerar inte):
```sql
SELECT * FROM musician;
SELECT * FROM MusicianQualification;
```

### ✅ RÄTT:
```sql
SELECT * FROM "Musician";
SELECT * FROM "MusicianQualification";
```

### Komplett exempel - Visa musiker med kvalifikationer:
```sql
SELECT 
  m."musicianId",
  m."firstName",
  m."lastName",
  i."name" as instrument,
  p."name" as position
FROM "Musician" m
JOIN "MusicianQualification" mq ON m."id" = mq."musicianId"
JOIN "Position" p ON mq."positionId" = p."id"
JOIN "Instrument" i ON p."instrumentId" = i."id"
ORDER BY m."musicianId", i."name", p."name";
```

### Vanliga queries:

#### Hämta alla musiker:
```sql
SELECT * FROM "Musician" WHERE "isArchived" = false;
```

#### Hämta musikers kvalifikationer:
```sql
SELECT 
  m."musicianId",
  m."firstName" || ' ' || m."lastName" as fullName,
  p."name" as position,
  i."name" as instrument
FROM "Musician" m
JOIN "MusicianQualification" mq ON m."id" = mq."musicianId"
JOIN "Position" p ON mq."positionId" = p."id"
JOIN "Instrument" i ON p."instrumentId" = i."id"
WHERE m."id" = 1;
```

#### Räkna kvalifikationer per musiker:
```sql
SELECT 
  m."musicianId",
  m."firstName",
  m."lastName",
  COUNT(mq."positionId") as qualificationCount
FROM "Musician" m
LEFT JOIN "MusicianQualification" mq ON m."id" = mq."musicianId"
GROUP BY m."id", m."musicianId", m."firstName", m."lastName";
```

## 🛠️ I Prisma/TypeScript kod

I kod använder vi camelCase UTAN quotes:
```typescript
// Prisma
const musicians = await prisma.musician.findMany({
  include: {
    qualifications: true
  }
});

// INTE prisma."Musician" eller prisma.Musician
```

## 📌 Minnesregel

- **I SQL/Supabase**: Använd `"UpperCamelCase"` med quotes
- **I TypeScript/Prisma**: Använd `lowerCamelCase` utan quotes
- **I URL:er/API**: Använd `lowercase` (t.ex. `/api/musicians`)

## 🔍 Kontrollera i Supabase

1. Gå till Table Editor
2. Alla tabeller visas med UpperCamelCase
3. När du skriver SQL, använd quotes runt allt