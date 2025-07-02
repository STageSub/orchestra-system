# Verifiera Data-isolering mellan Orkestrar

## Test 1: Grundläggande Isolering

### Steg 1: Öppna två webbläsarflikar
- Flik 1: http://uppsala.localhost:3000/admin
- Flik 2: http://goteborg.localhost:3000/admin

### Steg 2: Logga in på båda
Använd lösenord: `orchestra123`

### Steg 3: Kontrollera musiker
- Uppsala: Ska visa 0 musiker (tom databas)
- Göteborg: Ska visa 157 musiker

✅ **Lyckat test**: Data är helt separerad!

## Test 2: Skapa Data

### Steg 1: Skapa musiker i Uppsala
1. Gå till Uppsala-fliken
2. Klicka "Ny musiker"
3. Fyll i:
   - Förnamn: Test
   - Efternamn: Uppsala
   - E-post: test@uppsala.se
4. Spara

### Steg 2: Verifiera isolering
1. Uppsala: Ska visa 1 musiker
2. Göteborg: Ska fortfarande visa 157 musiker
3. Uppdatera båda flikarna (F5)
4. Verifiera att Uppsala-musikern INTE syns i Göteborg

✅ **Lyckat test**: Ny data stannar i rätt databas!

## Test 3: Projekt och Förfrågningar

### Steg 1: Skapa projekt i varje databas
- Uppsala: "Uppsala Vårkonsert 2025"
- Göteborg: "Göteborg Symfoni Nr 5"

### Steg 2: Verifiera
- Uppsala projekt syns INTE i Göteborg
- Göteborg projekt syns INTE i Uppsala

## Test 4: Superadmin Översikt

### Steg 1: Logga in som Superadmin
- Gå till: http://localhost:3000/admin/login
- Välj "Superadmin"
- Lösenord: `superadmin123`

### Steg 2: Kontrollera översikt
Dashboard ska visa:
- Totalt antal kunder: 4 (eller fler)
- Statistik från ALLA databaser
- Uppsala: 1 musiker
- Göteborg: 157 musiker

## Test 5: Samtidig Användning

### Steg 1: Öppna 4 flikar
- Göteborg admin
- Uppsala admin
- Malmö admin
- Stockholm admin

### Steg 2: Gör ändringar samtidigt
- Skapa musiker i olika databaser
- Skapa projekt parallellt
- Verifiera att ingen data blandas

## Troubleshooting

### "Uppsala fungerar inte"
1. Kontrollera att DATABASE_URL_UPPSALA finns i .env.local
2. Starta om servern efter ändring i .env.local
3. Verifiera att databasen är skapad i Supabase

### "Subdomain hittas inte"
Lägg till i `/etc/hosts`:
```
127.0.0.1 uppsala.localhost
127.0.0.1 goteborg.localhost
127.0.0.1 malmo.localhost
127.0.0.1 stockholm.localhost
```

### "Samma data visas överallt"
- Kontrollera att du inte har samma DATABASE_URL för flera subdomäner
- Verifiera database-config.ts mappningar

## Bekräftelse

När alla tester ovan lyckas har du bekräftat:
- ✅ 100% dataisolering mellan orkestrar
- ✅ Subdomain-routing fungerar korrekt
- ✅ Superadmin kan se aggregerad data
- ✅ Ingen risk för dataläckage

🎉 **Systemet är redo för multi-orkester användning!**