## System Architecture Overview
The mobile-first PWA captures spray applications and coordinates with a FastAPI backend and Supabase data store. Client-side modules handle authentication, GPS capture, and provisional PDF generation while delegating authoritative storage, weather retrieval, and final PDF rendering to backend services. Supabase enforces owner-scoped security through row-level policies and integrates with external weather webhooks.

```mermaid
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
```

## Data Relationships
Owner-scoped data spans applications and location records stored in Supabase. The data model links owners to farms and paddocks and captures per-application weather and GPS metadata to document each spray event. Paddock records retain the long-lived location for each field, while individual application_paddock rows can store a GPS snapshot whenever coordinates are supplied. No automated "within boundary" validation currently runs; stored GPS values reflect the readings provided by applicators.

```mermaid
erDiagram
  owners ||--o{ profiles : "has"
  owners ||--o{ farms : "has"
  owners ||--o{ paddocks : "has"
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
    numeric gps_latitude
    numeric gps_longitude
    numeric gps_accuracy_m
    timestamptz gps_updated_at
  }
  applications {
    uuid application_id PK
    uuid owner_id FK
    uuid mix_id
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
    numeric gps_latitude
    numeric gps_longitude
    numeric gps_accuracy_m
    timestamptz gps_captured_at
  }
```

## End-to-End Workflow
A typical spray record flows from paddock selection and GPS capture through weather enrichment, finalization, and PDF export. The sequence below shows how the frontend coordinates with FastAPI services, Supabase, and the Blynk weather webhook to deliver audit-ready records.

```mermaid
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
```

## Acceptance Criteria
- Tank mix builder allows selection of chemicals and water quantities with Supabase persistence for mixes and mix items.
- Owners can administer farms and paddocks, persisting paddock-level GPS coordinates and optionally capturing per-application GPS snapshots when provided, without requiring automated boundary validation.
- Weather snapshots captured via Blynk webhook populate wind, temperature, and humidity for each application.
- Final audit PDF is generated server-side with QR code and watermark, while an offline provisional PDF remains available in the PWA.
- Supabase row-level security ensures owner-scoped access across all records and authenticated sessions via Supabase Auth.

## Project Milestones
1. **Scaffold Complete** — Backend, frontend, and Supabase migrations in place to support core workflows.
2. **Weather Integration & Finalize UX** — Connect weather fetch endpoint, surface finalize button in the UI, and ensure application finalization triggers PDF generation.
3. **QA Audit Readiness** — Execute QA pass covering GPS accuracy, weather capture, mix management, and PDF outputs to validate readiness for audits.
