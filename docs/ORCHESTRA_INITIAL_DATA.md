# Orchestra Initial Data

## Overview

When a new orchestra is created in the StageSub system, it automatically receives a complete setup with all necessary data to start using the system immediately.

## What Gets Created Automatically

### 1. Instruments (14 total)
Each instrument is created with a specific display order for consistent presentation:

1. **Violin**
2. **Viola**
3. **Cello**
4. **Kontrabas**
5. **Flöjt**
6. **Oboe**
7. **Klarinett**
8. **Fagott**
9. **Valthorn**
10. **Trumpet**
11. **Trombon**
12. **Tuba**
13. **Slagverk**
14. **Harpa**

### 2. Positions (41 total)
Each instrument has specific positions with hierarchy levels:

#### Strings
- **Violin** (5 positions):
  - Förste konsertmästare (level 1)
  - Andre konsertmästare (level 2)
  - Stämledare violin 2 (level 3)
  - Tutti violin 1 (level 4)
  - Tutti violin 2 (level 5)

- **Viola** (3 positions):
  - Stämledare (level 1)
  - Alternerande stämledare (level 2)
  - Tutti (level 3)

- **Cello** (3 positions):
  - Solocellist (level 1)
  - Alternerande stämledare (level 2)
  - Tutti (level 3)

- **Kontrabas** (2 positions):
  - Stämledare (level 1)
  - Tutti (level 2)

#### Woodwinds
- **Flöjt** (3 positions):
  - Soloflöjt (level 1)
  - Stämledare flöjt 2 (level 2)
  - Piccolaflöjt (level 3)

- **Oboe** (3 positions):
  - Solooboe (level 1)
  - Stämledare oboe 2 (level 2)
  - Engelskt horn (level 3)

- **Klarinett** (4 positions):
  - Soloklarinett (level 1)
  - Stämledare klarinett 2 (level 2)
  - Essklarinett (level 3)
  - Basklarinett (level 4)

- **Fagott** (3 positions):
  - Solofagott (level 1)
  - Stämledare fagott 2 (level 2)
  - Kontrafagott (level 3)

#### Brass
- **Valthorn** (4 positions):
  - Solovalthorn (level 1)
  - Stämledare valthorn 2 (level 2)
  - Valthorn 3 (level 3)
  - Valthorn 4 (level 4)

- **Trumpet** (4 positions):
  - Solotrumpet (level 1)
  - Stämledare trumpet 2 (level 2)
  - Trumpet 3 (level 3)
  - Kornet (level 4)

- **Trombon** (3 positions):
  - Solotrombon (level 1)
  - Trombon 2 (level 2)
  - Bastrombon (level 3)

- **Tuba** (1 position):
  - Solotuba (level 1)

#### Other
- **Slagverk** (3 positions):
  - Soloslagverk (level 1)
  - Slagverk 2 (level 2)
  - Puka (level 3)

- **Harpa** (2 positions):
  - Soloharpa (level 1)
  - Harpa 2 (level 2)

### 3. Ranking Lists (123 total)
**Each position automatically gets three ranking lists:**
- **A-lista**: Primary list for top-tier musicians
- **B-lista**: Secondary list for qualified musicians
- **C-lista**: Reserve list for additional musicians

Total: 41 positions × 3 lists = 123 ranking lists

Each list is created with a descriptive name, for example:
- "A-lista för Förste konsertmästare (Violin)"
- "B-lista för Soloflöjt (Flöjt)"
- "C-lista för Tutti (Viola)"

### 4. Email Templates (4 Swedish templates)
The system creates professional email templates in Swedish:

1. **Request Template** (`request`)
   - Subject: "Förfrågan om vikarietjänst - {{projectName}}"
   - Variables: firstName, projectName, positionName, startDate, responseTime, responseUrl

2. **Reminder Template** (`reminder`)
   - Subject: "Påminnelse: Förfrågan om vikarietjänst - {{projectName}}"
   - Variables: firstName, projectName, positionName, responseUrl

3. **Confirmation Template** (`confirmation`)
   - Subject: "Bekräftelse: {{projectName}}"
   - Variables: firstName, projectName, positionName, startDate

4. **Position Filled Template** (`position_filled`)
   - Subject: "Tjänsten är tillsatt - {{projectName}}"
   - Variables: firstName, projectName, positionName

### 5. System Settings
Default settings configured for Swedish orchestras:
- **Language**: Swedish (sv)
- **Timezone**: Europe/Stockholm
- **Default Response Time**: 48 hours
- **Email From Name**: [Orchestra Name]
- **Email From Address**: no-reply@stagesub.com
- **Conflict Handling**: Warning strategy
- **Notifications**: Enabled

## Benefits

With this automatic setup:
- ✅ **No manual configuration needed** - Orchestra can start using the system immediately
- ✅ **Complete instrument coverage** - All standard orchestra instruments included
- ✅ **Proper hierarchy** - Positions ordered by importance
- ✅ **Ready ranking system** - A/B/C lists for every position
- ✅ **Professional communication** - Email templates ready to use
- ✅ **Swedish localization** - Everything configured for Swedish orchestras

## Customization

After the initial setup, orchestras can:
- Add or remove instruments
- Modify position names and hierarchy
- Customize email templates
- Add musicians to ranking lists
- Change system settings
- Add additional languages

## Technical Details

### ID Format
- Instruments: `INST001`, `INST002`, etc.
- Positions: `POS001`, `POS002`, etc.
- Ranking Lists: `RANK001`, `RANK002`, etc.

### Database Impact
- ~200 database records created per orchestra
- Takes approximately 2-3 seconds to seed all data
- All operations wrapped in transactions for consistency

### Future Enhancements
- [ ] English email templates
- [ ] Customizable instrument presets (chamber, symphony, etc.)
- [ ] Import/export ranking lists
- [ ] Template orchestra configurations