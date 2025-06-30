# Orchestra System - Ultimate Stress Test Report

**Generated:** 2025-06-29 00:20:17  
**Duration:** 10.68 seconds  
**Environment:** Production Dummy Data (151 musicians, 17 instruments, 41 positions)

---

## Executive Summary

- **Total Tests:** 21
- **Passed:** 19 (90.5%)
- **Failed:** 2
- **Warnings:** 1
- **Overall Status:** ⚠️ FAILED

## Test Categories

### Data Integrity (100% Pass Rate)

| Test | Status | Duration | Details |
|------|--------|----------|---------|
| verifyMusicianCounts | ✅ Passed | 520ms | total: 149<br>active: 128<br>inactive: 9<br>archived: 12<br>substitutes: 11<br>expected: {"total":151,"active":143,"inactive":8,"archived":15} |
| verifyInstruments | ✅ Passed | 100ms | count: 17<br>names: ["Violin","Viola","Cello","Kontrabas","Flöjt","Oboe","Klarinett","Fagott","Horn","Trumpet","Trombon","Tuba","Pukor","Slagverk","Harpa","Piano","Sång"]<br>hasSang: true |
| verifyPositions | ✅ Passed | 165ms | total: 42<br>voicePositions: ["Sopran","Alt","Tenor","Bas"]<br>withoutRankingLists: 0 |
| verifyRankingLists | ✅ Passed | 190ms | total: 126<br>byType: {"A":42,"C":42,"B":42} |
| verifyIdFormats | ✅ Passed | 186ms | samples: ["MUS132","INST017","POS039"] |

### Request Strategies (67% Pass Rate)

| Test | Status | Duration | Details |
|------|--------|----------|---------|
| testSequentialStrategy | ❌ Failed | 256ms | position: "Sopran"<br>needed: 3<br>sent: 3<br>accepted: 3 |
| testParallelStrategy | ✅ Passed | 261ms | position: "Tutti violin 1"<br>needed: 8<br>totalSent: 14<br>accepted: 8<br>finalActive: 6 |
| testFirstComeStrategy | ✅ Passed | 256ms | position: "Alt"<br>needed: 2<br>maxRecipients: 4<br>sent: 4<br>accepted: 2<br>positionFilledEmails: 1 |

### Email Flows (100% Pass Rate)

| Test | Status | Duration | Details |
|------|--------|----------|---------|
| testCompleteEmailFlow | ✅ Passed | 104ms | musician: "Kristina Lundberg"<br>emailsSent: 3<br>hasToken: true<br>hasAttachment: true |
| testDeclineFlow | ✅ Passed | 101ms | musician: "Karin Engström"<br>scenario: "declined"<br>confirmationsSent: 0 |
| testTimeoutHandling | ✅ Passed | N/A | sentAt: "2025-06-26T21:20:09.147Z"<br>responseTimeHours: 48<br>hoursElapsed: 49<br>isTimedOut: true |
| testFileAttachments | ✅ Passed | N/A | onRequestFiles: 1<br>onAcceptFiles: 1<br>totalFiles: 2 |

### Business Rules (75% Pass Rate)

| Test | Status | Duration | Details |
|------|--------|----------|---------|
| testOneRequestPerMusicianPerProject | ✅ Passed | 106ms | musician: "Maja Jansson"<br>positionsRequesting: ["Tutti violin 1","Tutti violin 2"]<br>requestsSent: 1 |
| testArchivedExclusion | ❌ Failed | 207ms | archivedCount: 5<br>activeCount: 5<br>archivedRequests: 1 |
| testInactiveHandling | ✅ Passed | 104ms | inactiveCount: 3<br>examples: ["Ebba Månsson","Peter Hansson"]<br>note: "Inactive musicians can receive requests but show red badge in UI" |
| testLocalResidenceFilter | ✅ Passed | 210ms | localMusicians: 43<br>totalActive: 128<br>percentage: "33.6%"<br>filterWorking: true |

### Performance (100% Pass Rate)

| Test | Status | Duration | Details |
|------|--------|----------|---------|
| testLargeScaleRequests | ✅ Passed | N/A | totalRequests: 1000<br>duration: "0ms"<br>requestsPerSecond: null<br>batchSize: 100 |
| testDatabaseQueryPerformance | ✅ Passed | 399ms | complexQueryResults: 34<br>aggregationResults: 3<br>totalDuration: "399ms" |

### Scenarios (100% Pass Rate)

| Test | Status | Duration | Details |
|------|--------|----------|---------|
| testOperaProduction | ✅ Passed | 212ms | voiceTypes: ["Alt","Sopran","Bas","Tenor"]<br>orchestraPositions: 4<br>totalMusiciansNeeded: 37<br>scenario: "Opera: La Bohème" |
| testEmergencySubstitution | ✅ Passed | 190ms | position: "Förste konsertmästare"<br>scenario: "Emergency - Concert tonight"<br>responseTimeHours: 2<br>contactedMusicians: 5<br>strategy: "first_come (emergency)" |
| testFestivalPlanning | ✅ Passed | N/A | projects: 4<br>totalMusiciansNeeded: 220<br>uniqueMusicians: 100<br>conflicts: 120<br>scenario: "Music Festival Week" |

## Performance Metrics

| Operation | Duration | Status |
|-----------|----------|--------|
| Data Integrity:verifyMusicianCounts | 520ms | ✅ Good |
| Data Integrity:verifyInstruments | 100ms | ✅ Good |
| Data Integrity:verifyPositions | 165ms | ✅ Good |
| Data Integrity:verifyRankingLists | 190ms | ✅ Good |
| Data Integrity:verifyIdFormats | 186ms | ✅ Good |
| Request Strategies:testSequentialStrategy | 256ms | ✅ Good |
| Request Strategies:testParallelStrategy | 261ms | ✅ Good |
| Request Strategies:testFirstComeStrategy | 256ms | ✅ Good |
| Email Flows:testCompleteEmailFlow | 104ms | ✅ Good |
| Email Flows:testDeclineFlow | 101ms | ✅ Good |
| Email Flows:testTimeoutHandling | 0ms | ✅ Good |
| Email Flows:testFileAttachments | 0ms | ✅ Good |
| Business Rules:testOneRequestPerMusicianPerProject | 106ms | ✅ Good |
| Business Rules:testArchivedExclusion | 207ms | ✅ Good |
| Business Rules:testInactiveHandling | 104ms | ✅ Good |
| Business Rules:testLocalResidenceFilter | 210ms | ✅ Good |
| large-scale-requests | 0ms | ✅ Good |
| Performance:testLargeScaleRequests | 0ms | ✅ Good |
| db-queries | 399ms | ✅ Good |
| Performance:testDatabaseQueryPerformance | 399ms | ✅ Good |
| Scenarios:testOperaProduction | 212ms | ✅ Good |
| Scenarios:testEmergencySubstitution | 190ms | ✅ Good |
| Scenarios:testFestivalPlanning | 0ms | ✅ Good |

## Errors

| Category | Test | Error |
|----------|------|-------|
| Request Strategies | testSequentialStrategy | undefined |
| Business Rules | testArchivedExclusion | undefined |

## Recommendations

Based on the test results:

1. ⚠️ **Address failing tests** - 2 tests need attention
2. Review error logs for root causes
3. Consider performance optimization for slow operations
4. Rerun tests after fixes

### Priority Issues:
1. Fix Request Strategies - testSequentialStrategy
2. Fix Business Rules - testArchivedExclusion


## Test Data Summary

### Musicians (151 total)
- Active: 143 (95%)
- Inactive: 8 (5%)
- Archived: 15
- Singers: 20 (Sopran: 5, Alt: 5, Tenor: 5, Bas: 5)

### Instruments (17 total)
Strings, Woodwinds, Brass, Percussion, Keyboard, Voice

### Positions (41 total)
Including all orchestral positions plus 4 voice types

### Projects (25 total)
- Completed: 10 (100% staffed)
- Upcoming: 15 (various request strategies)

---

*Report generated by Orchestra System Stress Test Suite*