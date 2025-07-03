# Database Isolation Issue

## Problem
När du loggar in som scosco-admin ser du data från andra orkestrar. Detta beror på att:

1. **Huvuddatabasen** innehåller:
   - Orchestra tabell (alla orkestrar)
   - User tabell (alla användare)
   
2. **Varje orkesterdatabas** innehåller:
   - Musician, Project, Request etc.
   - MEN ingen orchestraId koppling!

## Vad som händer nu:
1. Du loggar in som scosco-admin
2. Systemet hittar att du tillhör Orchestra SCOSO
3. Systemet byter till SCOSO:s databas
4. MEN alla tabeller i den databasen saknar orchestraId
5. Så du ser ALL data i den databasen (som kan innehålla data från andra orkestrar om de delar databas)

## Lösningar:

### Option 1: Strikt separata databaser (Rekommenderad)
- Varje orkester får sin HELT EGNA databas
- Ingen data delas mellan orkestrar
- Detta är vad du trodde du hade, men det verkar som databaser delas

### Option 2: Lägg till orchestraId överallt
- Lägg till orchestraId i ALLA tabeller
- Filtrera ALL data baserat på orchestraId
- Detta kräver stora schemaändringar

### Option 3: Kontrollera databaskonfiguration
- Verifiera att varje orkester verkligen har sin egen databas
- Kolla att databaseUrl är olika för olika orkestrar

## Nästa steg:
1. Kolla vilka databaser som faktiskt används
2. Verifiera att varje orkester har unik databas
3. Om databaser delas, måste vi antingen:
   - Skapa nya separata databaser
   - Eller lägga till tenant isolation med orchestraId