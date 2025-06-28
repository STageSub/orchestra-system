# ID-Prefix Guide - Orkestervikarieförfrågningssystem

## 🏷️ Översikt

Alla entiteter i systemet har unika ID:n med prefix för enkel identifiering. ID:n återanvänds **ALDRIG**, även om entiteten tas bort.

## 📋 Prefix-lista

| Prefix | Entitet | Exempel | Beskrivning |
|--------|---------|---------|-------------|
| **MUS** | Musiker | MUS001, MUS002 | Musikerinformation |
| **INST** | Instrument | INST001, INST002 | Instrumenttyper (Violin, Viola, etc.) |
| **POS** | Position | POS001, POS002 | Tjänster/kvalifikationer per instrument |
| **RANK** | Rankningslista | RANK001, RANK002 | Rankningslistor (Svår/Medel/Lätt) |
| **RNK** | Rankning | RNK001, RNK002 | Enskild musikers position i lista |
| **PROJ** | Projekt | PROJ001, PROJ002 | Orkesterprojekt |
| **NEED** | Projektbehov | NEED001, NEED002 | Bemanningsbehov per projekt |
| **REQ** | Förfrågan | REQ001, REQ002 | Vikarieförfrågningar |
| **TMPL** | E-postmall | TMPL001, TMPL002 | Mallar för olika e-posttyper |
| **COMM** | Kommunikation | COMM001, COMM002 | Kommunikationslogg |
| **FILE** | Fil | FILE001, FILE002 | Projektfiler och noter |
| **AUDIT** | Revision | AUDIT001, AUDIT002 | Ändringshistorik |

## 🔍 Användningsexempel

### När du ser ett ID kan du direkt förstå vad det är:

- **MUS042** → En musiker
- **PROJ015** → Ett projekt  
- **REQ234** → En förfrågan
- **RANK007** → En rankningslista
- **FILE089** → En uppladdad fil

### I kod:

```typescript
// Skapa ny musiker
const musicianId = await generateUniqueId('musician'); // "MUS001"

// Skapa nytt projekt
const projectId = await generateUniqueId('project'); // "PROJ001"

// Skapa ny förfrågan
const requestId = await generateUniqueId('request'); // "REQ001"
```

## 🔒 Säkerhet

### ID återanvänds ALDRIG

Om MUS001 tas bort/arkiveras:
- Nästa musiker får MUS002, inte MUS001
- Detta förhindrar alla framtida ID-konflikter
- Historisk data förblir korrekt

### Implementation

```typescript
// lib/id-generator.ts
export async function generateUniqueId(entityType: EntityType): Promise<string> {
  // Använder databastransaktion för atomicitet
  const result = await prisma.$transaction(async (tx) => {
    const sequence = await tx.idSequence.update({
      where: { entityType },
      data: { lastNumber: { increment: 1 } }
    });
    return sequence.lastNumber;
  });
  
  const prefix = ID_PREFIXES[entityType];
  return `${prefix}${result.toString().padStart(3, '0')}`;
}
```

## 📊 Fördelar med prefix

1. **Läsbarhet** - Direkt förståelse av vad ID:t representerar
2. **Debugging** - Enklare att spåra problem
3. **Säkerhet** - Svårare att gissa ID:n
4. **Sortering** - Naturlig gruppering i databaser
5. **Validering** - Kan validera ID-format

## 🎯 Best Practices

1. **Använd alltid generateUniqueId()** för nya entiteter
2. **Validera prefix** vid inkommande requests
3. **Inkludera prefix i fel-meddelanden** för tydlighet
4. **Visa prefix i användargränssnitt** för bättre UX

## 📝 Exempel i UI

```
Musikerprofil: MUS042 - Anna Svensson
Projekt: PROJ015 - Mahler Symphony No. 5
Förfrågan: REQ234 - Skickad 2024-01-15
Rankningslista: RANK007 - Förste konsertmästare (Svår)
```