# UI Validation Test Guide

## Test the AddProjectNeedModal Validation

### 1. Instruments with No Musicians
- **Expected**: "Slagverk" should be disabled in the instrument dropdown
- **Visual**: Should show "(0 musiker)" next to the instrument name

### 2. Positions with No Musicians
- **Expected**: The following positions should be disabled:
  - Engelskt horn (Oboe)
  - Tutti fagott (Fagott)
  - Kontrafagott (Fagott)
  - Tutti horn (Horn)
  - Tutti trumpet (Trumpet)
  - Bastrombon (Trombon)
  - Slagverkare (Slagverk)
- **Visual**: Should show "(0 musiker)" next to the position name

### 3. Quantity Dropdown Based on Strategy
- **Sequential**: Only shows "1" in dropdown
- **Parallel**: Shows options 2-20 
- **First Come**: Shows options 1-20

### 4. Strategy Switching
- When switching from "First Come" to "Sequential", quantity should automatically change to 1
- When switching from "Sequential" to "Parallel", quantity should automatically change to 2

### 5. Available Musicians Warning
- Select a ranking list
- If quantity exceeds available musicians, should show red warning: "Antal behov (X) är högre än tillgängliga musiker (Y)"
- Submit button should be disabled when warning is shown

### 6. Backend Validation
The API should reject invalid requests with Swedish error messages:
- Sequential with quantity > 1: "Sekventiell strategi måste ha antal = 1"
- Parallel with quantity < 2: "Parallell strategi kräver minst 2 behov"
- No qualified musicians: "Det finns inga kvalificerade musiker för denna position"
- Quantity > available: "Antal behov (X) är högre än tillgängliga musiker (Y)"