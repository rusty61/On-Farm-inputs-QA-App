flowchart LR
  subgraph Client [PWA: Next.js 14 (TS, Tailwind)]
    UI[Records + Admin UI]
    GPS[Geolocation API]
    Auth[Supabase Auth (JWT)]
    jsPDF[Provisional PDF (offline)]
  end

  subgraph Backend [FastAPI @ Render (Docker)]
    API[/REST: /api/*/]
    PDF[WeasyPrint PDF Export]
  end

  subgraph Data [Supabase (Postgres + RLS)]
    T1[owners, profiles]
    T2[farms, paddocks]
    T3[mixes, mix_items]
    T4[applications, application_paddocks]
    T5[blynk_stations]
  end

  subgraph Weather [Blynk]
    WX[(Webhook endpoint)]
  end

  UI -->|JWT via Auth| API
  GPS --> UI
  jsPDF ---> UI
  API <--> Data
  API --> PDF --> UI
  API --> WX


erDiagram
  owners ||--o{ profiles : "has"
  owners ||--o{ farms : "has"
  owners ||--o{ paddocks : "has"
  owners ||--o{ mixes : "has"
  mixes ||--o{ mix_items : "has"
  owners ||--o{ applications : "owns"
  applications ||--o{ application_paddocks : "has"

  owners {
    uuid owner_id PK
    text owner_name
  }
  profiles {
    uuid user_id PK
    uuid owner_id FK
    text full_name
    text role
  }
  farms {
    uuid farm_id PK
    uuid owner_id FK
    text farm_name
  }
  paddocks {
    uuid paddock_id PK
    uuid owner_id FK
    uuid farm_id FK
    text paddock_name
    numeric area_ha
    jsonb boundary_geojson
  }
  mixes {
    uuid mix_id PK
    uuid owner_id FK
    text name
  }
  mix_items {
    uuid item_id PK
    uuid mix_id FK
    text name
    numeric rate_value
    text rate_unit
  }
  applications {
    uuid application_id PK
    uuid owner_id FK
    uuid mix_id FK
    uuid operator_user_id
    timestamptz started_at
    timestamptz finished_at
    bool finalized
    geography gps_point
    numeric wind_speed_ms
    numeric wind_direction_deg
    numeric temp_c
    numeric humidity_pct
  }
  application_paddocks {
    uuid link_id PK
    uuid owner_id FK
    uuid application_id FK
    uuid paddock_id FK
    geography gps_point
    numeric gps_accuracy_m
    timestamptz gps_captured_at
    bool gps_within_boundary
  }

  sequenceDiagram
  participant U as User (PWA)
  participant FE as Next.js Frontend
  participant BE as FastAPI API
  participant DB as Supabase (RLS)
  participant WX as Blynk

  U->>FE: Select paddocks + Capture GPS per paddock
  FE->>BE: POST /api/applications (JWT / Dev headers)
  BE->>DB: insert application + application_paddocks
  DB-->>BE: application_id
  BE-->>FE: { application_id }

  U->>FE: Fetch Weather
  FE->>BE: POST /api/weather/fetch?station_id&application_id
  BE->>WX: GET webhook with API key
  WX-->>BE: { wind_ms, wind_deg, temp_c, humidity_pct }
  BE->>DB: update application weather

  U->>FE: Finalize
  FE->>BE: POST /api/applications/:id/finalize
  BE->>DB: set finalized, finished_at

  U->>FE: View PDF
  FE->>BE: GET /api/applications/:id/export.pdf
  BE->>DB: load application + paddocks + mix items
  BE->>BE: WeasyPrint render (with QR, watermark)
  BE-->>FE: PDF

