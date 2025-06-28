# Netlify Deployment Guide

## Steg 1: Förberedelser

1. **Installera Netlify CLI** (valfritt men rekommenderat):
   ```bash
   npm install -g netlify-cli
   ```

2. **Skapa en Netlify-konto** på https://www.netlify.com om du inte redan har ett.

## Steg 2: Deploy via Git (Rekommenderat)

1. **Push din kod till GitHub/GitLab/Bitbucket**
2. **Logga in på Netlify** och klicka "Add new site" → "Import an existing project"
3. **Välj din Git-provider** och auktorisera Netlify
4. **Välj ditt repository**
5. **Konfigurera build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. **Lägg till miljövariabler** under "Environment variables":
   ```
   DATABASE_URL=din-databas-url
   DIRECT_URL=din-direct-databas-url
   RESEND_API_KEY=din-resend-api-key
   JWT_SECRET=din-jwt-secret
   NEXT_PUBLIC_APP_URL=https://din-app.netlify.app
   ```
7. **Klicka "Deploy site"**

## Steg 3: Deploy via CLI (Alternativ)

```bash
# Logga in på Netlify
netlify login

# Bygg projektet
npm run build

# Deploy
netlify deploy --prod --dir=.next
```

## Steg 4: Efter deployment

1. **Uppdatera miljövariabler** med din faktiska Netlify URL
2. **Konfigurera domän** om du har en egen domän
3. **Aktivera HTTPS** (automatiskt på Netlify)

## Viktiga saker att tänka på:

### Next.js 15 Kompatibilitet
- Netlify stöder Next.js 15
- Edge Functions används automatiskt för bättre prestanda
- API Routes fungerar som Netlify Functions

### Databas
- Se till att din Supabase databas accepterar anslutningar från Netlify
- Lägg till Netlify's IP-adresser i Supabase's allowlist om nödvändigt

### Miljövariabler
- **VIKTIGT**: Ändra `NEXT_PUBLIC_APP_URL` till din Netlify-domän
- Alla hemliga nycklar ska läggas in i Netlify's miljövariabler, INTE i koden

### Build-optimeringar
Lägg till i `next.config.js` för bättre Netlify-prestanda:
```javascript
module.exports = {
  images: {
    unoptimized: true, // För statisk export
  },
  // ... övriga inställningar
}
```

## Felsökning

### Build misslyckas
- Kontrollera build logs i Netlify
- Se till att alla dependencies är installerade
- Verifiera att miljövariabler är korrekt satta

### 404 på API routes
- API routes blir Netlify Functions automatiskt
- Kontrollera att du använder rätt URL-struktur

### Långsam första laddning
- Detta är normalt för serverless functions
- Överväg att använda ISR (Incremental Static Regeneration) för ofta besökta sidor

## Fördelar med Netlify vs Vercel

- **Gratis SSL-certifikat**
- **Automatisk HTTPS**
- **Global CDN**
- **Automatiska deploys från Git**
- **Preview deploys för pull requests**
- **Serverless functions** (API routes)
- **Bra gratisnivå** (100GB bandwidth/månad)

## Netlify-specifika funktioner

Du kan lägga till dessa för extra funktionalitet:

### Redirects (_redirects fil)
```
/gamla-sidan /nya-sidan 301
```

### Headers (_headers fil)
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

### Forms (Netlify Forms)
Lägg till `data-netlify="true"` på formulär för att aktivera Netlify Forms.

## Support

- Netlify Docs: https://docs.netlify.com
- Next.js på Netlify: https://docs.netlify.com/frameworks/next-js/