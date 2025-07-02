# Guide: Skapa Ny Orkester (Uppsala Exempel)

## Steg 1: Skapa Databas i Supabase

1. Logga in på Supabase Dashboard
2. Klicka "New project"
3. Namn: `Orchestra Uppsala`
4. Databas lösenord: Spara säkert!
5. Region: `eu-north-1` (Stockholm)
6. Vänta på att projektet skapas (~2 minuter)

## Steg 2: Hämta Connection String

1. Gå till Settings → Database
2. Kopiera "Connection string" → "URI"
3. Ersätt `[YOUR-PASSWORD]` med ditt lösenord
4. Spara som `DATABASE_URL_UPPSALA`

## Steg 3: Uppdatera Environment Variables

Lägg till i `.env.local`:
```bash
DATABASE_URL_UPPSALA=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Steg 4: Uppdatera Database Config

Redigera `/lib/database-config.ts`:
```typescript
const DATABASE_URLS: Record<string, string> = {
  'goteborg': process.env.DATABASE_URL_GOTEBORG || process.env.DATABASE_URL!,
  'malmo': process.env.DATABASE_URL_MALMO || process.env.DATABASE_URL!,
  'stockholm': process.env.DATABASE_URL_STOCKHOLM || process.env.DATABASE_URL!,
  'uppsala': process.env.DATABASE_URL_UPPSALA || process.env.DATABASE_URL!, // NY!
  'admin': process.env.DATABASE_URL!,
  'localhost': process.env.DATABASE_URL!,
}
```

## Steg 5: Kör Migrations

```bash
# Skapa en temporär .env för Uppsala
echo "DATABASE_URL=$DATABASE_URL_UPPSALA" > .env.uppsala

# Kör migrations
dotenv -e .env.uppsala -- npx prisma migrate deploy

# Ta bort temp fil
rm .env.uppsala
```

## Steg 6: Seed Initial Data

Skapa `/scripts/seed-uppsala.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_UPPSALA
    }
  }
})

async function main() {
  // Skapa grundinstrument
  const instruments = [
    { name: 'Violin', displayOrder: 1 },
    { name: 'Viola', displayOrder: 2 },
    { name: 'Cello', displayOrder: 3 },
    { name: 'Kontrabas', displayOrder: 4 },
  ]
  
  for (const inst of instruments) {
    await prisma.instrument.create({ data: inst })
  }
  
  // Skapa email templates
  await prisma.emailTemplate.createMany({
    data: [
      {
        type: 'request',
        subject: 'Förfrågan om vikariat - {{projectName}}',
        body: 'Hej {{firstName}}! Vi behöver en {{instrumentName}} för {{projectName}}...'
      },
      // ... fler templates
    ]
  })
  
  console.log('✅ Uppsala databas seedat!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Kör:
```bash
DATABASE_URL_UPPSALA=... npx ts-node scripts/seed-uppsala.ts
```

## Steg 7: Testa

1. Starta servern: `npm run dev`
2. Gå till: http://uppsala.localhost:3000/admin
3. Logga in med: `orchestra123`
4. Verifiera att du ser en tom Uppsala-databas

## Steg 8: Verifiera Isolering

1. Öppna två flikar:
   - http://uppsala.localhost:3000/admin
   - http://goteborg.localhost:3000/admin
2. Skapa en musiker i Uppsala
3. Verifiera att den INTE syns i Göteborg
4. ✅ Data är helt isolerad!

## Automatisering (Framtida)

För att automatisera processen behövs:

1. **Supabase Management API**
   - Skapa projekt programmatiskt
   - Kräver Enterprise-plan

2. **PostgreSQL Master Database**
   - CREATE DATABASE privilegier
   - Egen server eller managed service

3. **Pre-provisioned Pool**
   - Ha 5-10 tomma databaser redo
   - Tilldela när behövs
   - Snabbaste lösningen

## Troubleshooting

### "Subdomain fungerar inte"
- Lägg till i `/etc/hosts`:
  ```
  127.0.0.1 uppsala.localhost
  127.0.0.1 goteborg.localhost
  ```

### "Migration failed"
- Kontrollera DATABASE_URL_UPPSALA
- Verifiera databas-lösenord
- Kolla Supabase connection limits

### "No data showing"
- Kör seed script
- Kontrollera subdomain i browser
- Verifiera database-config.ts