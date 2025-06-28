# API Documentation

## Overview

All API endpoints follow RESTful conventions and return JSON responses. The base URL for all API calls is `/api`.

## Authentication

Currently, the system does not implement authentication. This will be added in a future phase.

## Endpoints

### Musicians

#### GET /api/musicians
Get all musicians with optional filtering.

**Query Parameters:**
- `search` (string): Search by name
- `instrument` (string): Filter by instrument
- `status` (string): Filter by status (active/inactive/archived)

**Response:**
```json
[
  {
    "id": 1,
    "musicianId": "MUS001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "status": "active",
    "qualifications": [
      {
        "position": {
          "id": 1,
          "name": "1:a Konsertmästare",
          "instrument": {
            "id": 1,
            "name": "Violin"
          }
        }
      }
    ]
  }
]
```

#### GET /api/musicians/[id]
Get a specific musician by ID.

#### POST /api/musicians
Create a new musician.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "status": "active",
  "notes": "Optional notes",
  "qualifications": [1, 2, 3]  // Position IDs
}
```

#### PUT /api/musicians/[id]
Update a musician.

#### DELETE /api/musicians/[id]
Delete a musician (soft delete - marks as archived).

### Instruments

#### GET /api/instruments
Get all instruments with positions and unique musician count.

**Response:**
```json
[
  {
    "id": 1,
    "instrumentId": "INST001",
    "name": "Violin",
    "displayOrder": 1,
    "positions": [
      {
        "id": 1,
        "positionId": "POS001",
        "name": "1:a Konsertmästare",
        "hierarchyLevel": 1,
        "_count": {
          "qualifications": 5
        }
      }
    ],
    "totalUniqueMusicians": 15,
    "_count": {
      "positions": 3
    }
  }
]
```

#### POST /api/instruments
Create a new instrument with positions.

**Request Body:**
```json
{
  "name": "Violin",
  "displayOrder": 1,
  "positions": [
    {
      "name": "1:a Konsertmästare",
      "hierarchyLevel": 1
    }
  ]
}
```

#### PUT /api/instruments/[id]
Update an instrument.

#### DELETE /api/instruments/[id]
Delete an instrument (only if no musicians are assigned).

**Note**: Cascade delete will automatically remove:
- All positions for the instrument
- All ranking lists for those positions
- All rankings in those lists

### Positions

#### POST /api/instruments/[id]/positions
Add a position to an instrument.

**Request Body:**
```json
{
  "name": "Stämledare",
  "hierarchyLevel": 2
}
```

#### PUT /api/positions/[id]
Update a position name.

**Request Body:**
```json
{
  "name": "New Position Name"
}
```

#### DELETE /api/positions/[id]
Delete a position (only if no musicians are assigned).

**Note**: Cascade delete will automatically remove all ranking lists for this position.

#### PUT /api/positions/reorder
Reorder positions within an instrument.

**Request Body:**
```json
{
  "positions": [
    { "id": 1, "hierarchyLevel": 1 },
    { "id": 2, "hierarchyLevel": 2 }
  ]
}
```

### Ranking Lists

#### GET /api/rankings
Get all ranking lists grouped by position.

**Response:**
```json
{
  "1": {  // Position ID
    "positionName": "1:a Konsertmästare",
    "instrumentName": "Violin",
    "lists": {
      "A": {
        "id": 1,
        "listType": "A",
        "description": "Högsta nivån",
        "musicians": []
      },
      "B": { ... },
      "C": { ... }
    }
  }
}
```

#### GET /api/rankings/[id]
Get a specific ranking list with musicians.

**Response:**
```json
{
  "id": 1,
  "listType": "A",
  "description": "Högsta nivån",
  "position": {
    "id": 1,
    "name": "1:a Konsertmästare",
    "instrument": {
      "name": "Violin"
    }
  },
  "musicians": [
    {
      "id": 1,
      "rankingPosition": 1,
      "musician": {
        "id": 1,
        "musicianId": "MUS001",
        "name": "John Doe",
        "status": "active"
      }
    }
  ]
}
```

#### PUT /api/rankings/[id]
Update ranking list description.

**Request Body:**
```json
{
  "description": "New description"
}
```

#### PUT /api/rankings/[id]/reorder
Reorder musicians in a ranking list.

**Request Body:**
```json
{
  "musicians": [
    { "musicianId": 1, "rankingPosition": 1 },
    { "musicianId": 2, "rankingPosition": 2 }
  ]
}
```

#### POST /api/rankings/[id]/musicians
Add musicians to a ranking list.

**Request Body:**
```json
{
  "musicianIds": [1, 2, 3]
}
```

#### DELETE /api/rankings/[id]/musicians/[musicianId]
Remove a musician from a ranking list.

#### DELETE /api/rankings/[id]
Delete a ranking list (only if no musicians are in the list).

**Note**: Returns the list to "+ Skapa lista" state in the UI.

#### DELETE /api/rankings/[id]/clear
Clear all musicians from a ranking list.

#### DELETE /api/rankings/[id]/musicians/[musicianId]
Remove a specific musician from a ranking list.

### Musician Availability

#### GET /api/musicians/[id]/availability
Get availability for a specific musician.

#### POST /api/availability
Create or update availability.

**Request Body:**
```json
{
  "musicianId": 1,
  "date": "2024-01-15",
  "isAvailable": false,
  "notes": "On vacation"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message in Swedish",
  "details": "Optional technical details"
}
```

**Common HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 409: Conflict (e.g., duplicate entry)
- 500: Internal Server Error

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)

**Response Headers:**
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages

## Notes

1. All text responses use Swedish for user-facing messages
2. IDs in URLs can be either numeric database IDs or string IDs (e.g., "MUS001")
3. Dates use ISO 8601 format (YYYY-MM-DD)
4. All endpoints validate input and return appropriate error messages