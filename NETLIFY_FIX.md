# Netlify Deployment Fix

Felet du får ("Unable to read file isInteger.js") är vanligt med Next.js på Netlify. Här är lösningarna:

## Steg 1: Uppdatera konfigurationen (REDAN GJORT)

Jag har uppdaterat:
- `next.config.js` - Lagt till standalone output och image optimizations
- `netlify.toml` - Lagt till Node version och funktionskonfiguration
- `package.json` - Lagt till prisma generate i build-scriptet

## Steg 2: Rensa och bygg om lokalt

```bash
# Rensa cache
rm -rf .next
rm -rf node_modules
rm -rf .netlify

# Installera om
npm install

# Bygg lokalt för att testa
npm run build
```

## Steg 3: Deploy igen

### Alternativ A: Via Netlify Drop (Enklast för test)
1. Efter att ha kört `npm run build` lokalt
2. Dra hela projektmappen till Netlify Drop
3. ELLER använd Netlify CLI:
   ```bash
   netlify deploy --prod --dir=.
   ```

### Alternativ B: Via Git
1. Commit alla ändringar:
   ```bash
   git add .
   git commit -m "Fix Netlify deployment configuration"
   git push
   ```
2. I Netlify dashboard, trigga en ny deploy

## Steg 4: Om det fortfarande inte fungerar

### Försök med statisk export:
1. Ändra i `next.config.js`:
   ```javascript
   const nextConfig = {
     output: 'export',  // Ändra från 'standalone' till 'export'
     // ... resten
   }
   ```

2. Ändra i `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "out"  # Ändra från ".next" till "out"
   ```

### Alternativ lösning - Använd Vercel:
Om Netlify fortsätter krångla är Vercel optimerat för Next.js:
```bash
npm i -g vercel
vercel
```

## Vanliga Netlify-problem med Next.js 15:

1. **Module resolution**: Next.js 15 använder ny module resolution
2. **Edge functions**: Kan behöva stängas av
3. **Node version**: Måste vara 18+

## Miljövariabler att lägga till i Netlify:

```
DATABASE_URL=din-supabase-url
DIRECT_URL=din-supabase-direct-url
RESEND_API_KEY=din-resend-key
JWT_SECRET=din-jwt-secret
NEXT_PUBLIC_APP_URL=https://din-app.netlify.app
```

## Om inget fungerar:

Prova deployment på andra plattformar:
- **Vercel** (bäst för Next.js)
- **Railway.app**
- **Render.com**
- **Fly.io**

Alla dessa har bättre Next.js 15 stöd än Netlify just nu.