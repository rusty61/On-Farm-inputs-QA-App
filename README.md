# Infield Spray Record

Mobile-first PWA to capture spray applications for QA audits.
Built with **Next.js 14 + Tailwind + Supabase Auth → FastAPI + Supabase (Postgres) + WeasyPrint**.
Deployed via **Vercel (frontend)** + **Docker/Render (backend)**.

## Features

- **Tank Mix Builder** — Create and manage chemical mixes with precise water quantities
- **Owner/Farm/Paddock Administration** — Complete property management system
- **GPS Capture** — Per-paddock location tracking with accuracy metrics
- **Weather Integration** — Real-time weather snapshots via Blynk webhook API
- **Audit-Grade PDF Export** — Server-generated PDFs with QR codes and watermarks
- **Offline Support** — Provisional PDF generation using jsPDF when offline
- **Row-Level Security** — Supabase RLS ensures owner-scoped data access

## Tech Stack

**Frontend:**
- Next.js 14.1.4 with App Router
- TypeScript
- Tailwind CSS
- SWR for data fetching
- jsPDF for offline PDF generation
- Lucide React for icons

**Backend:**
- FastAPI with Python 3.12
- Supabase (PostgreSQL + Auth)
- WeasyPrint for PDF rendering
- SQLAlchemy for ORM
- AsyncPG for async database operations

**Infrastructure:**
- Supabase for managed PostgreSQL and authentication
- Docker containerization for backend
- Vercel-ready frontend deployment
- Render-compatible Docker setup

## Project Structure

```
.
├── apps/backend/          # FastAPI service
│   ├── app/
│   │   ├── routers/      # API route handlers
│   │   ├── services/     # Business logic
│   │   ├── templates/    # PDF HTML templates
│   │   ├── auth.py       # JWT authentication
│   │   ├── config.py     # Configuration management
│   │   ├── db_supabase.py # Database connection
│   │   ├── models.py     # SQLAlchemy models
│   │   └── schemas.py    # Pydantic schemas
│   └── routes/           # Legacy route organization
├── frontend/             # Next.js application
│   ├── app/             # Next.js 14 app directory
│   │   ├── (app)/       # Authenticated routes
│   │   └── (auth)/      # Authentication routes
│   ├── components/      # React components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── providers/   # Context providers
│   └── lib/             # Utilities and types
├── docs/                # Documentation
│   ├── DesignBrief.md   # Architecture and workflow
│   └── RiskRegister.md  # QA and risk management
├── Dockerfile           # Backend container definition
├── requirements.txt     # Python dependencies
└── INSTALL.md          # Detailed setup instructions
```

## Quick Start

### Prerequisites

- Node.js 20.x LTS
- Python 3.11+
- Supabase account (free tier works)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rusty61/On-Farm-inputs-QA-App.git
   cd On-Farm-inputs-QA-App
   ```

2. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Note your project URL and anon key from Settings → API
   - Apply database migrations (see INSTALL.md)

3. **Configure environment variables**
   ```bash
   # Root .env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start the backend**
   ```bash
   cd apps/backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r ../../requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

For detailed setup instructions including deployment, see [INSTALL.md](INSTALL.md).

## Deployment

### Frontend (Vercel)

1. Import the repository in Vercel
2. Set root directory to `frontend`
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_BASE_URL` (your backend URL)
4. Deploy

### Backend (Docker/Render)

1. **Using Docker:**
   ```bash
   docker build -t spray-backend .
   docker run -p 8000:8000 --env-file .env spray-backend
   ```

2. **Deploy to Render:**
   - Create a new Web Service
   - Connect your GitHub repository
   - Set Docker environment
   - Configure environment variables from Supabase
   - Deploy

## Documentation

- **[Design Brief](docs/DesignBrief.md)** — System architecture, data model, and workflow diagrams
- **[Risk Register](docs/RiskRegister.md)** — QA considerations and mitigation strategies
- **[Installation Guide](INSTALL.md)** — Comprehensive setup and deployment instructions

## Development Status

**Completed:**
- Full-stack application scaffold
- Backend API with FastAPI
- Frontend UI with Next.js 14
- Supabase integration for auth and data
- GPS capture functionality
- Mix builder and property management
- PDF generation infrastructure

**In Progress:**
- Weather webhook integration
- Finalize application workflow UI
- Comprehensive QA testing

**Planned:**
- Enhanced offline support
- Mobile PWA optimizations
- Advanced reporting features

## Contributing

This project follows a role-based development approach:

- **Team Leader** — Defines scope and acceptance criteria
- **Software Engineer** — Implements architecture and modules
- **QA/Debug** — Manages risks, testing, and bug reproduction

Full persona profiles: [Team Profiles Repository](https://github.com/rusty61/Team-Profiles-for-chatgtp/tree/main/personas)

## Repository

[On-Farm-inputs-QA-App](https://github.com/rusty61/On-Farm-inputs-QA-App)

## License

See repository for license information.

