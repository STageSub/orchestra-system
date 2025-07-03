# Subdomain Routing för Orchestra System

## Översikt

Orchestra System använder subdomäner för att dirigera varje orkester till sin egen databas. Detta fungerar automatiskt både lokalt och i produktion.

## Hur det fungerar

1. **Middleware** (`/middleware.ts`) läser hostname och extraherar subdomän
2. **Subdomän sätts i headers** som `x-subdomain`
3. **API routes** läser subdomän från headers och använder rätt databas
4. **Database Config** (`/lib/database-config.ts`) mappar subdomän till databas-URL

## Lokal utveckling

### Steg 1: Konfigurera /etc/hosts

Kör setup-scriptet:
```bash
./scripts/setup-local-hosts.sh
```

Eller manuellt:
```bash
sudo nano /etc/hosts
```

Lägg till:
```
127.0.0.1   scoso.localhost
127.0.0.1   sco.localhost
127.0.0.1   goteborg.localhost
127.0.0.1   malmo.localhost
```

### Steg 2: Använd subdomäner

Istället för `http://localhost:3000`, använd:
- `http://scoso.localhost:3000`
- `http://sco.localhost:3000`

## Produktion (Vercel)

I produktion fungerar subdomäner automatiskt:
- `https://scoso.stagesub.com`
- `https://sco.stagesub.com`

Vercel hanterar wildcard-domäner automatiskt.

## Databaskonfiguration

### Miljövariabler

För varje orkester, lägg till i `.env.local`:
```
DATABASE_URL_SCOSO=postgresql://...
DATABASE_URL_SCO=postgresql://...
```

### Automatisk databassökning

Systemet söker databas i denna ordning:
1. Miljövariabel: `DATABASE_URL_{SUBDOMAIN}`
2. Orchestra-tabell i huvuddatabasen
3. Fallback till huvuddatabasen

## API Implementation

Alla API routes använder:
```typescript
import { getPrismaForRequest } from '@/lib/prisma-subdomain'

export async function GET(request: Request) {
  const prisma = await getPrismaForRequest(request)
  // Använd prisma som vanligt
}
```

## Felsökning

### "Kan inte nå sajten" lokalt
- Kontrollera att du lagt till subdomänen i `/etc/hosts`
- Använd port 3000: `http://subdomain.localhost:3000`

### Fel databas används
- Kontrollera att miljövariabeln finns: `DATABASE_URL_SUBDOMAIN`
- Verifiera att Orchestra-posten har rätt `databaseUrl`

### Middleware körs inte
- Kontrollera att `/middleware.ts` finns
- Verifiera matcher-konfigurationen

## Testning

1. **Lokal test med olika databaser**:
   ```bash
   # Öppna två flikar
   http://sco.localhost:3000/admin     # Använder SCO databas
   http://scoso.localhost:3000/admin   # Använder SCOSO databas
   ```

2. **Verifiera rätt databas**:
   - Kontrollera att rätt musiker visas
   - Olika instrument/rankningslistor per orkester

## Säkerhet

- Varje orkester har helt isolerad databas
- Ingen korsreferens mellan orkestrar möjlig
- Admin-användare är kopplade till specifik orkester