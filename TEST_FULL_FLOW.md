# 🧪 Test Guide: Hela Request/Response-flödet

Denna guide hjälper dig testa hela systemet från förfrågan till svar.

## 📋 Förberedelser

1. **Se till att emails fungerar**
   - `FORCE_REAL_EMAILS=true` i `.env.local`
   - Servern är omstartad efter miljöändringen

2. **Ha en testmusiker redo**
   - Gå till `/admin/musicians`
   - Skapa eller välj en musiker med din riktiga e-postadress
   - Notera musikerns instrument och position

## 🚀 Steg 1: Skapa ett testprojekt

1. Gå till `/admin/projects`
2. Klicka "Nytt projekt"
3. Fyll i:
   - **Namn**: "Test Email Flow"
   - **Datum**: Välj framtida datum
   - **Repetitionsschema**: "Måndag-Fredag 10:00-12:00"
   - **Konsertinformation**: "Konserthuset, lördag 19:00"
   - **Anteckningar**: "Detta är ett testprojekt"

## 📬 Steg 2: Lägg till musikerbehov

1. I projektets detaljvy, klicka "Lägg till behov"
2. Välj:
   - **Instrument**: Det instrument din testmusiker spelar
   - **Position**: Den position musikern har
   - **Rankningslista**: Välj den lista där musikern finns
   - **Antal**: 1
   - **Förfrågningsstrategi**: Börja med "Sekventiell"
   - **Svarstid**: 1 minut (för snabb testning)

## 📤 Steg 3: Skicka förfrågningar

1. Klicka "Skicka alla förfrågningar" (blå knapp)
2. Bekräfta i dialogen
3. Kontrollera konsolen för debug-information

## ✉️ Steg 4: Kontrollera förfrågnings-email

1. Kolla din inkorg (kan ta några sekunder)
2. Du bör få ett email med:
   - Ämne: "Förfrågan om vikariat - Test Email Flow - [position]"
   - Projektinformation
   - En länk för att svara (börjar med http://localhost:3000/respond?token=...)

## 🔗 Steg 5: Testa svarslänken

1. Klicka på länken i emailet
2. Du kommer till `/respond` sidan
3. Verifiera att du ser:
   - Ditt namn
   - Projektnamn
   - Position/instrument
   - Datum och tider

## ✅ Steg 6: Svara på förfrågan

### Test 1: Tacka JA
1. Klicka "Tacka ja"
2. Vänta på bekräftelse
3. Kolla din email för bekräftelse-mail
4. Gå tillbaka till projektet i admin och verifiera:
   - Status visar "1/1 accepterade"
   - Förfrågan är markerad som accepterad

### Test 2: Tacka NEJ (nytt behov)
1. Skapa ett nytt behov
2. Upprepa steg 3-5
3. Klicka "Tacka nej" denna gång
4. Verifiera i admin att:
   - Status visar "0/1 accepterade"
   - Förfrågan är markerad som avböjd

## 🔄 Steg 7: Testa olika strategier

### Parallell strategi
1. Skapa behov med **antal: 2**
2. Välj **Parallell** strategi
3. Se till att minst 3 musiker finns i rankningslistan
4. Skicka förfrågningar
5. Verifiera att 2 musiker får förfrågan samtidigt

### Först till kvarn
1. Skapa behov med **Först till kvarn**
2. Sätt **Max mottagare: 3**
3. Skicka och verifiera att 3 musiker får förfrågan
4. När någon tackar ja ska de andra få "position filled" email

## 🐛 Felsökning

### Email kommer inte fram
- Kontrollera konsolen för fel
- Verifiera i Resend dashboard (resend.com)
- Kontrollera spam-mappen

### Token fungerar inte
- Kontrollera att länken är komplett
- Verifiera att token inte redan använts
- Kolla konsolen för felmeddelanden

### Status uppdateras inte
- Refresha sidan
- Kontrollera nätverksfliken i utvecklarverktyg
- Se konsolen för API-fel

## 📊 Snabbtest med Test Requests

För snabbare testning utan att vänta på emails:

1. Gå till Settings → "🧪 Test Requests"
2. Skapa test-förfrågningar
3. Använd "Simulera svar" för att testa olika scenarios
4. Kör "Process reminders" och "Process timeouts" manuellt

## ✨ Lycka till med testningen!

När allt fungerar har du verifierat att:
- ✅ Förfrågningar skickas korrekt
- ✅ Tokens genereras och fungerar
- ✅ Svarssidan visar rätt information
- ✅ Svar registreras korrekt
- ✅ Bekräftelse-emails skickas
- ✅ Status uppdateras i systemet