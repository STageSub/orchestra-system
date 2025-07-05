# System Flow Diagrams

## Login Flow - Regular User

```mermaid
sequenceDiagram
    participant U as User
    participant W as stagesub.com
    participant C as Central DB
    participant O as Orchestra DB

    U->>W: 1. Visit stagesub.com/admin/login
    U->>W: 2. Enter username/password
    W->>C: 3. Verify credentials
    C-->>W: 4. Return user + orchestraId
    W->>C: 5. Get orchestra details
    C-->>W: 6. Return databaseUrl
    W->>O: 7. Connect to orchestra DB
    W-->>U: 8. Show orchestra dashboard
```

## Login Flow - Superadmin

```mermaid
sequenceDiagram
    participant S as Superadmin
    participant W as stagesub.com
    participant C as Central DB
    participant O1 as SCO DB
    participant O2 as SCOSO DB

    S->>W: 1. Login with superadmin role
    W->>C: 2. Verify superadmin
    C-->>W: 3. Confirm role=superadmin
    W-->>S: 4. Redirect to /superadmin
    S->>W: 5. Request metrics
    W->>C: 6. Get all orchestras
    C-->>W: 7. Return orchestra list
    W->>O1: 8a. Get SCO metrics
    W->>O2: 8b. Get SCOSO metrics
    O1-->>W: 9a. Return counts
    O2-->>W: 9b. Return counts
    W-->>S: 10. Display dashboard
```

## Data Flow - Creating a Musician

```mermaid
flowchart LR
    A[Admin User] -->|1. Create Musician| B[API Endpoint]
    B -->|2. Get orchestraId from token| C[Auth Middleware]
    C -->|3. Route to correct DB| D{Which Orchestra?}
    D -->|SCO| E[SCO Database]
    D -->|SCOSO| F[SCOSO Database]
    E -->|4. Insert Musician| G[Return Success]
    F -->|4. Insert Musician| G
    G -->|5. Response| A
```

## Database Relationship Diagram

```mermaid
erDiagram
    CENTRAL-DB {
        Orchestra id
        Orchestra orchestraId
        Orchestra name
        Orchestra databaseUrl
        Orchestra status
        User id
        User username
        User orchestraId
        User role
    }
    
    SCO-DB {
        Musician id
        Musician name
        Project id
        Project name
        Request id
        SystemLog id
    }
    
    SCOSO-DB {
        Musician id
        Musician name
        Project id
        Project name
        Request id
        SystemLog id
    }
    
    CENTRAL-DB ||--o{ SCO-DB : "routes to"
    CENTRAL-DB ||--o{ SCOSO-DB : "routes to"
```

## Request Routing Logic

```mermaid
flowchart TD
    A[HTTP Request] --> B{API Route}
    B -->|/api/superadmin/*| C[Check Superadmin Auth]
    B -->|/api/*| D[Check User Auth]
    
    C -->|Valid| E[Access All Orchestras]
    C -->|Invalid| F[401 Unauthorized]
    
    D -->|Valid| G[Get User's OrchestraId]
    D -->|Invalid| F
    
    G --> H[Get Orchestra DB URL]
    H --> I[Route to Specific DB]
    
    E --> J[Loop Through All Orchestra DBs]
    J --> K[Aggregate Results]
    
    I --> L[Execute Query]
    K --> M[Return Combined Data]
    L --> N[Return Orchestra Data]
```

## Adding New Orchestra Flow

```mermaid
flowchart TD
    A[Create Supabase Project] --> B[Get Connection String]
    B --> C[Deploy Schema]
    C --> D[Add to Central DB]
    D --> E[Create Admin User]
    E --> F[Test Login]
    F --> G{Works?}
    G -->|Yes| H[Production Deploy]
    G -->|No| I[Troubleshoot]
    I --> F
    H --> J[Update Docs]
    J --> K[Notify Customer]
```

## Security Boundaries

```mermaid
flowchart LR
    subgraph "Public Internet"
        A[User Browser]
    end
    
    subgraph "Application Layer"
        B[stagesub.com]
        C[Auth Middleware]
    end
    
    subgraph "Data Layer"
        D[Central DB - Neon]
        E[SCO DB - Supabase]
        F[SCOSO DB - Supabase]
    end
    
    A -->|HTTPS| B
    B -->|JWT Auth| C
    C -->|SSL| D
    C -->|SSL| E
    C -->|SSL| F
    
    E -.->|No Connection| F
    
    style E fill:#e1f5e1
    style F fill:#e1f5e1
    style D fill:#e1e5f5
```

## Key Points Illustrated

1. **Single Entry Point**: All users enter through stagesub.com
2. **No Subdomain Routing**: Authentication determines orchestra, not URL
3. **Complete Isolation**: Orchestra databases cannot communicate
4. **Central Registry**: All routing decisions made via central DB
5. **Role-Based Access**: Superadmin can access all, others only their orchestra
6. **Secure Boundaries**: Each database connection is isolated and SSL-encrypted