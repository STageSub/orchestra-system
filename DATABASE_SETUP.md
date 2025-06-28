# 🗄️ Databas Setup - Steg för steg

## 📋 Checklista

- [ ] Skapat Supabase-konto
- [ ] Skapat nytt projekt i Supabase
- [ ] Kopierat Database URL
- [ ] Kopierat Supabase URL och Anon Key
- [ ] Uppdaterat .env och .env.local
- [ ] Kört databas-migrering
- [ ] Kört seed-script

## 🔧 Detaljerade instruktioner

### 1. Efter att du skapat Supabase-projekt

Du behöver dessa värden från Supabase Dashboard:

1. **Database URL** (Settings → Database → Connection string → URI)
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```

2. **Supabase URL** (Settings → API → Project URL)
   ```
   https://xxxxxxxxxxxx.supabase.co
   ```

3. **Anon Key** (Settings → API → anon public)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. Uppdatera miljövariabler

Uppdatera **BÅDE** `.env` och `.env.local` med dina värden:

**.env** (för Prisma):
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**.env.local** (för Next.js):
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 3. Kör databas-migrering

När miljövariablerna är på plats, kör:

```bash
# Generera Prisma Client
npx prisma generate

# Skapa tabeller i databasen
npx prisma migrate dev --name init
```

Om migreringen lyckas ser du:
```
✔ Generated Prisma Client
✔ Database migrations applied
```

### 4. Seed databasen med grunddata

```bash
# Lägg till instrument och e-postmallar
npx prisma db seed
```

Detta skapar:
- 4 instrument (Violin, Viola, Cello, Kontrabas)
- Alla positioner för varje instrument
- 4 e-postmallar
- ID-sekvenser för alla tabeller

### 5. Verifiera i Supabase

1. Gå till Supabase Dashboard
2. Klicka på **Table Editor** i sidomenyn
3. Du bör se alla 15 tabeller:
   - musicians (tom)
   - instruments (4 rader)
   - positions (12 rader)
   - email_templates (4 rader)
   - id_sequences (12 rader)
   - etc...

### 6. Testa applikationen

```bash
# Starta utvecklingsservern
npm run dev
```

Gå till http://localhost:3000/admin/musicians och testa:
1. Skapa en ny musiker
2. Se att musiker-ID genereras (MUS001)
3. Redigera och visa profil

## 🚨 Vanliga problem

### Problem: "Can't reach database server"
**Lösning**: Kontrollera att DATABASE_URL är korrekt och att lösenordet är rätt

### Problem: "relation does not exist"
**Lösning**: Kör `npx prisma migrate dev` igen

### Problem: "Environment variable not found"
**Lösning**: 
1. Kontrollera att både .env och .env.local är uppdaterade
2. Starta om Next.js-servern

### Problem: "Invalid API key"
**Lösning**: Kontrollera att NEXT_PUBLIC_SUPABASE_ANON_KEY är korrekt kopierad

## ✅ När allt fungerar

Du vet att allt är korrekt konfigurerat när:
1. `npx prisma migrate dev` körs utan fel
2. `npx prisma db seed` lägger till grunddata
3. Du kan skapa en musiker i admin-panelen
4. Musikern får ID MUS001

## 🆘 Behöver du hjälp?

Om något inte fungerar:
1. Kontrollera felmeddelandet noga
2. Verifiera alla miljövariabler igen
3. Kolla i Supabase Dashboard att projektet är "Active"
4. Fråga mig om specifika fel!