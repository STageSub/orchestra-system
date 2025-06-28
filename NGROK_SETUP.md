# 🌐 Ngrok Setup för Mobiltestning

När du utvecklar lokalt och vill testa från mobilen behöver du en publik URL. Ngrok är perfekt för detta!

## 📥 Installation

### Mac (med Homebrew)
```bash
brew install ngrok
```

### Eller ladda ner direkt
Besök https://ngrok.com/download

## 🚀 Användning

1. **Starta din Next.js app**
   ```bash
   npm run dev
   ```

2. **I en ny terminal, starta ngrok**
   ```bash
   ngrok http 3000
   ```

3. **Du får en publik URL**
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Uppdatera miljövariabel**
   Redigera `.env.local`:
   ```
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

5. **Starta om Next.js**
   - Stoppa servern (Ctrl+C)
   - Starta igen: `npm run dev`

## 📱 Testa från mobilen

1. Skicka en ny förfrågan från systemet
2. Kolla din email på mobilen
3. Länkarna kommer nu gå till ngrok-URL:en
4. Du kan svara direkt från mobilen!

## ⚠️ Viktigt

- Ngrok URL ändras varje gång du startar om
- Gratis-versionen har begränsningar (100 anslutningar/minut)
- Glöm inte ändra tillbaka till `http://localhost:3000` när du är klar

## 🔒 Säkerhet

- Dela aldrig ngrok-URL:en offentligt
- Stäng av ngrok när du inte använder det
- För produktion, använd en riktig domän istället

## 🎯 Tips

- Skapa ett gratis ngrok-konto för att få en fast subdomain
- Använd `ngrok http 3000 --domain=your-domain.ngrok-free.app`
- Då behöver du inte uppdatera URL:en varje gång!