# Orchestra System Dummy Data Documentation

## Overview

This document describes the complete test dataset structure for the Orchestra System. The dummy data creates a realistic orchestra environment with 131 musicians, multiple ranking lists, historical and future projects, and comprehensive request history.

## Quick Start

To create the complete dummy dataset:

```bash
node scripts/create-all-dummy-data.js
```

This master script runs all data creation scripts in the correct sequence.

## Data Structure

### 1. Orchestra Composition (151 Musicians Total)

#### String Section (50 musicians)
- **Violin 1**: 14 tutti + 2 leaders = 16 total
  - Förste konsertmästare (1)
  - Andre konsertmästare (1)
  - Tutti violin 1 (14)
- **Violin 2**: 12 tutti + 2 leaders = 14 total
  - Stämledare violin 2 (4)
  - Biträdande stämledare violin 2 (4)
  - Tutti violin 2 (12)
- **Viola**: 10 tutti + 2 leaders = 12 total
  - Stämledare viola (4)
  - Biträdande stämledare viola (4)
  - Tutti viola (10)
- **Cello**: 8 tutti + 2 soloists = 10 total
  - Solocellist (4)
  - Biträdande solocellist (4)
  - Tutti cello (8)
- **Double Bass**: 6 tutti + 1 leader = 7 total
  - Stämledare kontrabas (4)
  - Tutti kontrabas (6)

#### Wind Section (49 musicians)
- **Flute**: 4 tutti + soloists = 8 total
  - Soloflöjt (4)
  - Tutti flöjt (4)
  - Piccoloflöjt (4)
- **Oboe**: 4 tutti + soloists = 8 total
  - Solooboe (4)
  - Tutti oboe (4)
  - Engelskt horn (4)
- **Clarinet**: 4 tutti + soloists = 8 total
  - Soloklarinett (4)
  - Tutti klarinett (4)
  - Basklarinett (4)
- **Bassoon**: 4 tutti + soloists = 8 total
  - Solofagott (4)
  - Tutti fagott (4)
  - Kontrafagott (4)

#### Brass Section (21 musicians)
- **Horn**: 5 tutti + soloists = 9 total
  - Solohorn (4)
  - Tutti horn (5)
- **Trumpet**: 4 tutti + soloists = 8 total
  - Solotrumpet (4)
  - Tutti trumpet (4)
- **Trombone**: 4 tutti + soloists = 8 total
  - Solotrombon (4)
  - Tutti trombon (4)
  - Bastrombon (4)
- **Tuba**: 1 soloist = 4 total
  - Solotuba (4)

#### Percussion & Others (11 musicians)
- **Timpani**: Solopukist (4)
- **Percussion**: Slagverkare (4)
- **Harp**: Harpist (4)
- **Piano**: Pianist (4)

#### Voice Section (20 singers)
- **Sopran**: 5 singers (female voices)
- **Alt**: 5 singers (female voices)
- **Tenor**: 5 singers (male voices)
- **Bas**: 5 singers (male voices)

### 2. Musician Categories

- **Active Musicians**: 143 (95%)
- **Inactive Musicians**: 8 (5%)
- **Archived Musicians**: 15 (historical data)
- **Substitute Musicians**: 10 (marked with "-vikarie" suffix)
- **Local Residence**: ~30% of musicians
- **Singers**: 20 (Sopran, Alt, Tenor, Bas)

### 3. Ranking Lists

Each position has three ranking lists (A, B, C) with overlapping musicians:
- **A List**: Top 60% of qualified musicians
- **B List**: 70% starting from 30% overlap with A
- **C List**: 50% from bottom half with some B overlap

This creates realistic scenarios where musicians appear on multiple lists.

### 4. Projects

#### Completed Projects (10 historical - all 100% staffed)
1. **Vårkonsert 2025 - Vivaldi Årstiderna** (3 months ago) - Seasonal concert
2. **Julkonsert 2024** (6 months ago) - Holiday concert
3. **Beethoven Festival - Symfoni 3, 5 & 9** (4 months ago) - Major festival
4. **Midsommarkonsert 2024** (12 months ago) - Outdoor summer concert
5. **Sibelius Minneskonsert** (8 months ago) - Memorial concert
6. **Familjeföreställning - Djurens Karneval** (2 months ago) - Family concert
7. **Nyårskonsert 2024 - Straussgala** (18 months ago) - New Year gala
8. **Modern Musik Festival - Nordic Sounds** (9 months ago) - Contemporary music
9. **Mozartveckan** (10 months ago) - Mozart festival
10. **Barnens Favoriter - Filmmusik** (5 months ago) - Children's concert

All completed projects show:
- Status: "Genomförd" (automatically determined by past date)
- 100% staffing achieved (alla behov uppfyllda)
- All requests accepted by musicians
- Clean communication logs

#### Upcoming Projects (15 future)
1. **Beethoven Symfoni Nr. 5** (Week 29)
2. **Mozart Requiem** (Week 31)
3. **Nyårskonsert - Wienervals** (Week 28)
4. **Brahms Symfoni Nr. 1** (Week 32)
5. **Kammarmusikkonsert** (Week 27)
6. **Mahler Symfoni Nr. 2** (Week 34)
7. **Sibelius Symfoni Nr. 2** (Week 33)
8. **Barockensemble - Händel** (Week 30)
9. **Filmmusikkonsert** (Week 35)
10. **Nutida musik - Världspremiär** (Week 37)
11. **Skolkonsert - Peter och vargen** (Week 36)
12. **Operagala** (Week 38)
13. **Jubileumskonsert 100 år** (Week 41)
14. **Sommarkonsert utomhus** (Week 46)
15. **Turné - Norrland** (Week 51)

### 5. Request Strategies

Projects use different request strategies:
- **Sequential**: One at a time, wait for response
- **Parallel**: Multiple active requests (quantity-based)
- **First Come**: Send to maxRecipients, first responders get positions

### 6. File Attachments

Mock PDF files attached to projects:
- **Sheet Music**: beethoven-symfoni-5-noter.pdf, mozart-requiem-noter.pdf, etc.
- **Information**: konsert-information.pdf, klädkod-information.pdf
- **Logistics**: parkering-vägbeskrivning.pdf, turneschema-2025.pdf
- **Schedules**: repetitionsschema.pdf

Files are distributed with timing:
- `on_request`: Sent with initial request
- `on_accept`: Sent after musician accepts

### 7. Request History

Completed projects include realistic request patterns:
- **Accepted**: Musicians who took the position
- **Declined**: Musicians who declined the offer
- **Timed Out**: Musicians who didn't respond in time
- **Communication Logs**: Email history for each request

## Test Scenarios

The dummy data supports testing:

1. **Conflict Detection**: Musicians on multiple ranking lists
2. **Availability**: Archived and inactive musician handling
3. **Request Strategies**: All three strategies with various configurations
4. **Email Flows**: Complete request → reminder → response → confirmation
5. **File Distribution**: Attachments at different stages
6. **Historical Analysis**: Past project success rates
7. **Capacity Planning**: Various orchestra sizes and needs
8. **Local Residence**: Filtering for local-only positions

## Data Recreation

### Configuration File

Each run creates `scripts/dummy-data-run.json` with:
```json
{
  "createdAt": "2025-06-28T20:00:00.000Z",
  "version": "1.0",
  "steps": [...],
  "duration": "45.23",
  "environment": {
    "node": "v20.0.0",
    "platform": "darwin"
  }
}
```

### Individual Scripts

1. **reset-orchestra-data.js**: Clean database and create orchestra structure
2. **add-archived-musicians.js**: Add historical archived musicians
3. **update-emails.js**: Update all emails to @stagesubtest.com
4. **create-completed-projects.js**: Create historical projects
5. **create-test-projects.js**: Create upcoming projects

### Email Safety

All musician emails use `@stagesubtest.com` domain to prevent accidental emails to real addresses.

## Statistics Summary

- **Musicians**: 151 total (143 active, 8 inactive, 15 archived)
- **Instruments**: 17 types (including Sång)
- **Positions**: 41 different roles (including 4 voice types)
- **Ranking Lists**: 123 (3 per position)
- **Projects**: 25 total (10 completed, 15 upcoming)
- **Completed Projects**: All with 100% staffing (genomförda)
- **Project Needs**: ~250 positions (completed + upcoming)
- **File Attachments**: 10 unique PDFs, 62+ associations
- **Request History**: ~200+ accepted requests for completed projects
- **Success Rate**: 100% for all completed projects
- **Voice Section**: 20 singers (5 each: Sopran, Alt, Tenor, Bas)

## Maintenance

To update the dummy data:

1. Modify individual creation scripts as needed
2. Run `node scripts/create-all-dummy-data.js` to recreate
3. The master script ensures proper execution order
4. Check `dummy-data-run.json` for execution details

## Notes

- Musicians with "-vikarie" suffix are substitutes with multiple qualifications
- Archived musicians have realistic archive dates and reasons
- Project success rates vary based on type (outdoor concerts harder to staff)
- Email addresses are safe for testing (all @stagesubtest.com)