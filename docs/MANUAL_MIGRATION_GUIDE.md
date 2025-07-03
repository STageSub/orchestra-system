# Manual Migration Guide för Nya Orkestrar

## Översikt

När du skapar en ny orkester med automatisk databasprovisionering via Supabase Management API, måste tabeller skapas manuellt med Prisma-migrationer. Detta är en engångsprocess för varje ny orkester.

## Steg-för-steg Guide

### 1. Skapa Ny Orkester

1. Gå till Superadmin → Orkesterhantering
2. Klicka på "Skapa ny orkester"
3. Fyll i formuläret med orkesterinformation
4. Efter skapandet visas:
   - Admin-inloggningsuppgifter
   - Migreringskommando
   - Supabase projekt-ID

**VIKTIGT**: Spara all information som visas! Den visas bara en gång.

### 2. Kör Migrationer

#### Alternativ A: Använd det medföljande skriptet

```bash
./scripts/run-migrations.sh "postgresql://..."
```

#### Alternativ B: Kör Prisma-kommandot direkt

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Ersätt `postgresql://...` med den fullständiga databas-URL som visades när orkestern skapades.

### 3. Verifiera Installation

1. Gå tillbaka till Orkesterhantering i superadmin
2. Orkestern ska nu visa:
   - Status: "Aktiv" (grön badge)
   - Databas: "Klar att använda" (grön bock)
3. Klicka på "Öppna Admin" för att gå till orkesterns adminpanel
4. Logga in med de admin-uppgifter som visades vid skapandet

## Felsökning

### "Migrationer misslyckades"

Om migreringarna misslyckas:

1. **Kontrollera databas-URL**: Säkerställ att du kopierade hela URL:en korrekt
2. **Vänta några sekunder**: Nya Supabase-projekt kan ta upp till 60 sekunder att bli helt redo
3. **Kontrollera nätverksanslutning**: Säkerställ att du har internetanslutning

### "Kan inte ansluta till databasen"

1. Kontrollera att Supabase-projektet är aktivt i Supabase Dashboard
2. Verifiera att databas-lösenordet är korrekt i URL:en
3. Försök igen efter 1-2 minuter

### Orkestern visar fortfarande "Migrationer krävs"

Efter lyckade migrationer:

1. Kör detta SQL-kommando i Supabase SQL Editor:
   ```sql
   UPDATE "Orchestra" 
   SET status = 'active' 
   WHERE subdomain = 'din-subdoman';
   ```
2. Ladda om superadmin-sidan

## Automatisk vs Manuell Provisionering

### Automatisk (Nya Supabase-databaser)
- Skapar helt ny isolerad databas
- Kräver manuella migrationer
- Bäst för företagskunder som vill ha dedikerad infrastruktur
- Kostar extra för varje databas

### Poolad (Fördefinierade databaser)
- Använder befintliga databaser med redan körda migrationer
- Ingen manuell konfiguration krävs
- Lämplig för mindre orkestrar
- Mer kostnadseffektivt

## Säkerhetsnoteringar

- Databas-URL:er innehåller lösenord - hantera dem säkert
- Kör aldrig migrationer på produktionsdatabaser utan backup
- Admin-lösenord genereras automatiskt och är unika för varje orkester
- Ändra admin-lösenordet efter första inloggningen

## Framtida Förbättringar

Vi arbetar på att automatisera migreringsprocessen helt. Tills dess är manuella migrationer det säkraste sättet att säkerställa att alla tabeller skapas korrekt.

## Support

Om du stöter på problem:

1. Kontrollera loggarna i Vercel Dashboard
2. Verifiera databaskonfigurationen i Supabase Dashboard
3. Kontakta systemadministratören med:
   - Orkesternamn och subdomän
   - Exakt felmeddelande
   - Tidpunkt för försöket