# Authentication System Documentation

## Översikt

Orchestra System använder ett enkelt men säkert JWT-baserat autentiseringssystem för att skydda admin-området. Systemet är designat för att vara lätt att konfigurera och underhålla.

## Teknisk Implementation

### JWT Token Hantering
- **Library**: `jose` - Modern och säker JWT implementation
- **Token Lifetime**: 24 timmar
- **Storage**: httpOnly cookies (kan inte läsas av JavaScript)
- **Algorithm**: HS256

### Säkerhetsfunktioner

#### 1. Rate Limiting
- Max 5 inloggningsförsök per IP-adress
- 15 minuters timeout vid överskriden gräns
- In-memory storage (bör uppgraderas till Redis i produktion)

#### 2. Secure Cookies
```typescript
{
  httpOnly: true,                    // Förhindrar XSS-attacker
  secure: true (i produktion),       // Endast HTTPS
  sameSite: 'lax',                  // CSRF-skydd
  maxAge: 60 * 60 * 24,             // 24 timmar
  path: '/'
}
```

#### 3. Middleware Protection
- Alla routes under `/admin/*` skyddas automatiskt
- Undantag: `/admin/login` är alltid tillgänglig
- Automatisk redirect till login vid saknad/ogiltig session

## Filstruktur

```
/app/admin/login/page.tsx          # Login UI
/app/api/auth/login/route.ts       # Login endpoint
/app/api/auth/logout/route.ts      # Logout endpoint
/lib/auth.ts                       # Auth utilities
/middleware.ts                     # Route protection
```

## Konfiguration

### Miljövariabler (.env.local)

```env
# Admin lösenord (MÅSTE ändras i produktion)
ADMIN_PASSWORD=ditt-säkra-lösenord

# JWT Secret (MÅSTE vara lång och slumpmässig i produktion)
JWT_SECRET=en-mycket-lång-slumpmässig-sträng-minst-32-tecken
```

### Generera säker JWT Secret

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Användning

### Logga in
1. Navigera till `/admin`
2. Automatisk redirect till `/admin/login`
3. Ange lösenord
4. Vid lyckad inloggning → redirect till `/admin`

### Logga ut
- Klicka "Logga ut" i admin header
- Session rensas och redirect till login

### Session Hantering
- Sessions varar i 24 timmar
- Ingen "kom ihåg mig" funktion (av säkerhetsskäl)
- Session förnyas INTE automatiskt

## API Endpoints

### POST /api/auth/login
**Request:**
```json
{
  "password": "string"
}
```

**Response (success):**
```json
{
  "success": true
}
```

**Response (error):**
```json
{
  "error": "Fel lösenord"
}
```

### POST /api/auth/logout
Ingen body krävs. Rensar session cookie.

## Säkerhetsrekommendationer

### För Produktion

1. **Starkt lösenord**
   - Minst 16 tecken
   - Blanda stora/små bokstäver, siffror, specialtecken
   - Använd lösenordshanterare

2. **Unik JWT Secret**
   - Minst 32 tecken
   - Helt slumpmässig
   - Aldrig återanvänd från andra projekt

3. **HTTPS obligatoriskt**
   - Cookies sätts med `secure: true`
   - All trafik måste vara krypterad

4. **Regelbunden rotation**
   - Byt lösenord var 3:e månad
   - Rotera JWT secret årligen

### Framtida förbättringar

1. **Fleranvändarsystem**
   ```typescript
   // Exempel struktur
   interface User {
     id: string
     email: string
     passwordHash: string
     role: 'admin' | 'editor' | 'viewer'
     lastLogin: Date
   }
   ```

2. **Two-Factor Authentication (2FA)**
   - TOTP (Time-based One-Time Password)
   - SMS eller email-verifiering

3. **Audit Logging**
   - Logga alla inloggningsförsök
   - Spåra admin-åtgärder
   - IP-adress och user agent

4. **Session Management**
   - Lista aktiva sessioner
   - Möjlighet att avsluta sessioner
   - Enhetsinformation

5. **Password Policy**
   - Krav på lösenordskomplexitet
   - Lösenordshistorik
   - Tvingad lösenordsändring

## Troubleshooting

### "För många inloggningsförsök"
- Vänta 15 minuter
- Eller starta om servern (rensar rate limit cache)

### Session timeout
- Sessions varar endast 24 timmar
- Logga in igen efter timeout

### Cookie blockeras
- Kontrollera browser-inställningar
- Tillåt cookies för domänen
- Kontrollera att HTTPS används (i produktion)

### Glömt lösenord
- Ingen självbetjäning finns
- Ändra i `.env.local` och starta om server

## Kod-exempel

### Kontrollera autentisering i Server Component
```typescript
import { isAuthenticated } from '@/lib/auth'

export default async function AdminPage() {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    redirect('/admin/login')
  }
  
  // Resten av komponenten...
}
```

### Skydda API Route
```typescript
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAuthenticated()) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // API logic...
}
```

## Säkerhetskontroller

- [ ] Lösenord ändrat från default
- [ ] JWT secret är minst 32 tecken
- [ ] HTTPS aktiverat i produktion
- [ ] Rate limiting testad
- [ ] Logout fungerar korrekt
- [ ] Sessions timeout efter 24h
- [ ] Middleware skyddar alla admin routes