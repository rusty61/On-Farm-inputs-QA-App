# Installation & Deployment Guide

Complete setup guide for the Infield Spray Record application stack — Supabase (Postgres + Auth), FastAPI backend, and Next.js frontend. This guide will help you go from cloning the repository to running everything locally and deploying to Vercel + Render.

## Repository Layout

```text
.
├── apps/backend/        # FastAPI service (Docker deployable)
│   ├── app/            # Application code
│   │   ├── routers/    # API endpoints
│   │   ├── services/   # Business logic
│   │   └── templates/  # PDF templates
│   └── routes/         # Legacy routes (being migrated)
├── frontend/           # Next.js 14 app (Vercel deployable)
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   └── lib/           # Utilities and types
├── docs/              # Documentation
├── Dockerfile         # Backend container
├── requirements.txt   # Python dependencies
├── README.md
└── INSTALL.md         # (this file)
```

---

## 1. Prerequisites

### Accounts & Services

| Purpose | Account |
|---------|---------|
| Database + Auth | [Supabase](https://supabase.com) project (free tier works) |
| Frontend hosting | [Vercel](https://vercel.com) account with GitHub integration |
| Backend hosting | [Render](https://render.com) account (Web Service) |
| Weather webhook (optional) | [Blynk](https://blynk.io) account + device token |

### Local Tooling

| Tool | Version / Notes |
|------|-----------------|
| Git | Latest |
| Node.js | v20.x LTS (use `nvm` or `fnm` for version management) |
| npm | npm ≥ 9 ships with Node 20 |
| Python | 3.11+ (3.12 recommended) |
| pip / virtualenv | Any environment manager to isolate backend dependencies |
| Docker Desktop | Optional — for containerized development |

---

## 2. Environment Variables Reference

The application uses environment variables for configuration. Below are the required and optional variables:

### Root Level (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL (Settings → API) |
| `VITE_SUPABASE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public key |

### Backend Environment Variables

The backend reads from the root `.env` file or uses these variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for admin operations |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret for token validation |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `FASTAPI_ENV` | No | `development` or `production` |
| `BLYNK_BASE_URL` | No | Blynk API base URL for weather data |
| `BLYNK_TOKEN` | No | Blynk device authentication token |
| `PORT` | No | Server port (default: 8000) |

### Frontend Environment Variables

Create `frontend/.env.local` with:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as root VITE_SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same as root VITE_SUPABASE_SUPABASE_ANON_KEY |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API URL (e.g., `http://localhost:8000` or production URL) |

**Example `.env` file:**

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=eyJhbG...
```

**Example `frontend/.env.local` file:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 3. Supabase Setup

### Create Supabase Project

1. **Sign up and create project**
   - Go to [supabase.com](https://supabase.com) and create an account
   - Click "New Project"
   - Choose a name, database password, and region
   - Wait for project provisioning (2-3 minutes)

2. **Collect credentials**
   - Navigate to **Settings → API**
   - Copy these values:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public** key
     - **service_role** key (keep this secret!)
   - Navigate to **Settings → API → JWT Secret**
   - Copy the JWT secret

3. **Configure authentication**
   - Go to **Authentication → Providers**
   - Email/password is enabled by default
   - Disable email confirmation for development:
     - Settings → Auth → Enable email confirmations: **OFF**

### Database Schema Setup

The application uses Supabase's managed PostgreSQL database. You'll need to create the database schema for the application.

**Option A: Using Supabase Dashboard (Recommended)**

1. Navigate to **SQL Editor** in your Supabase dashboard
2. Create and run migration scripts to set up:
   - `owners` table
   - `profiles` table (linked to auth.users)
   - `farms` table
   - `paddocks` table
   - `mixes` and `mix_items` tables
   - `applications` and `application_paddocks` tables
   - `blynk_stations` table (for weather data)
   - Row Level Security (RLS) policies

3. Example migration for owners table:
   ```sql
   CREATE TABLE IF NOT EXISTS owners (
     owner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view their own owner data"
     ON owners FOR SELECT
     TO authenticated
     USING (
       owner_id IN (
         SELECT owner_id FROM profiles WHERE user_id = auth.uid()
       )
     );
   ```

**Option B: Using Supabase CLI**

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. Link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Create and apply migrations:
   ```bash
   supabase migration new initial_schema
   # Edit the migration file in supabase/migrations/
   supabase db push
   ```

For the complete data model, see [docs/DesignBrief.md](docs/DesignBrief.md).

---

## 4. Backend (FastAPI) Setup

The FastAPI backend is located in `apps/backend/`.

### Install System Dependencies (for WeasyPrint)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2 libpango-1.0-0 libpangoft2-1.0-0 \
  libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info fonts-dejavu-core
```

**macOS:**
```bash
brew install cairo pango gdk-pixbuf libffi
```

**Windows:**
WeasyPrint on Windows can be challenging. Consider using Docker or WSL2.

### Install Python Dependencies

1. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install --upgrade pip
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Configure Backend Environment

The backend reads from the root `.env` file. Ensure it contains:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=eyJhbG...
```

For production, also set:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`

### Start Backend Server

```bash
# From project root
uvicorn apps.backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Verify Backend

1. Open [http://localhost:8000/healthz](http://localhost:8000/healthz)
   - Should return: `{"ok": true}`

2. Open [http://localhost:8000/docs](http://localhost:8000/docs)
   - Interactive API documentation (Swagger UI)

3. Check available endpoints:
   - `/api/owners`
   - `/api/farms`
   - `/api/paddocks`
   - `/api/mixes`
   - `/api/applications`
   - `/api/weather`

---

## 5. Frontend (Next.js) Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Frontend Environment

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. **Create an account:**
   - Navigate to http://localhost:3000/login
   - Click "Sign Up"
   - Enter email and password
   - You'll be logged in automatically

2. **Set up your profile:**
   - Create an owner record
   - Add farms and paddocks
   - Build chemical mixes

3. **Test core workflows:**
   - Create a spray application
   - Capture GPS coordinates
   - Fetch weather data (if Blynk is configured)
   - Generate PDF export

### Build for Production

```bash
npm run build
npm start
```

---

## 6. Running the Full Stack Locally

### Development Workflow

You'll need three terminal windows:

**Terminal 1: Backend**
```bash
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn apps.backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3: Commands/Testing**
Use for git, testing, database operations, etc.

### Verification Checklist

- [ ] Backend health check responds at http://localhost:8000/healthz
- [ ] Frontend loads at http://localhost:3000
- [ ] Can register new user account
- [ ] Can create owner, farm, and paddock records
- [ ] Can build chemical mixes
- [ ] Can create spray application
- [ ] GPS capture works (requires HTTPS or localhost)
- [ ] PDF generation works (test with backend endpoint)

### Testing PDF Generation

```bash
# Get an application ID from the database or UI
curl http://localhost:8000/api/applications/{application_id}/export.pdf --output test.pdf
```

If WeasyPrint errors occur, verify system dependencies are installed.

---

## 7. Deployment

### Prerequisites

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] GitHub repository set up
- [ ] Code pushed to main branch

### Deploy Backend to Render

1. **Create Web Service**
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Service**
   - **Name:** `spray-backend` (or your choice)
   - **Environment:** `Docker`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Dockerfile Path:** `./Dockerfile`

3. **Add Environment Variables**
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
   SUPABASE_JWT_SECRET=your-jwt-secret
   DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
   FASTAPI_ENV=production
   BLYNK_BASE_URL=https://blynk.cloud (optional)
   BLYNK_TOKEN=your-token (optional)
   PORT=8000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment (5-10 minutes)
   - Note your service URL (e.g., `https://spray-backend.onrender.com`)

5. **Verify**
   - Visit `https://your-app.onrender.com/healthz`
   - Should return `{"ok": true}`

### Deploy Frontend to Vercel

1. **Import Project**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

3. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build (2-3 minutes)
   - Note your deployment URL (e.g., `https://your-app.vercel.app`)

5. **Verify**
   - Visit your Vercel URL
   - Test login/registration
   - Verify API calls reach backend

### Configure CORS (Backend)

Update `apps/backend/app/main.py` to allow your frontend domain:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Supabase Production Configuration

1. **Enable Backups**
   - Project Settings → Database → Backups
   - Enable daily backups

2. **Configure Auth URLs**
   - Authentication → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: Add your production domain

3. **Review RLS Policies**
   - Ensure all tables have proper Row Level Security
   - Test with production auth tokens

### Custom Domains (Optional)

**Frontend (Vercel):**
- Project Settings → Domains
- Add your custom domain
- Configure DNS records as instructed

**Backend (Render):**
- Service → Settings → Custom Domain
- Add your backend domain
- Configure DNS CNAME record

### Post-Deployment Checklist

- [ ] Backend health check responds
- [ ] Frontend loads and connects to backend
- [ ] User registration works
- [ ] Login/logout works
- [ ] Data persistence verified
- [ ] PDF generation works
- [ ] GPS capture works (requires HTTPS)
- [ ] Weather API integration (if configured)
- [ ] CORS headers allow frontend
- [ ] SSL certificates active
- [ ] Database backups enabled

---

## 8. Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check Python version
python --version  # Should be 3.11+

# Verify virtual environment
source .venv/bin/activate
which python  # Should point to .venv

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**Frontend build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 20.x
```

**Supabase connection errors:**
- Verify environment variables are set correctly
- Check Supabase project status in dashboard
- Ensure database password is correct
- Verify IP allowlist (if restricted)

**RLS Policy errors:**
- Use Supabase SQL Editor to test queries
- Check that user has proper `owner_id` in profiles table
- Verify JWT token is being sent with requests
- Review policy definitions in database

**WeasyPrint PDF errors:**
- Verify system dependencies installed (Cairo, Pango)
- Check font availability
- Test with simple HTML first
- Review WeasyPrint logs for specific errors

**Docker build fails:**
```bash
# Clean rebuild
docker build --no-cache -t spray-backend .

# Check logs
docker logs [container-id]
```

**CORS errors in production:**
- Add production domain to CORS middleware
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check browser console for exact error
- Ensure credentials are allowed

### Development Tips

**Database inspection:**
```bash
# Using Supabase CLI
supabase db inspect

# Direct psql connection
psql "$DATABASE_URL"
```

**View backend logs:**
```bash
# Local development
# Logs appear in terminal running uvicorn

# Render deployment
# View in Render dashboard → Logs tab
```

**Generate TypeScript types from Supabase:**
```bash
supabase gen types typescript --project-id YOUR_PROJECT_REF > frontend/lib/database.types.ts
```

### Getting Help

- **Application issues:** Check [docs/DesignBrief.md](docs/DesignBrief.md) and [docs/RiskRegister.md](docs/RiskRegister.md)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **FastAPI:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
- **WeasyPrint:** [weasyprint.org/docs](https://weasyprint.org/docs)

---

You are now ready to develop features, run QA scenarios, and ship updates. For architecture details, see the [Design Brief](docs/DesignBrief.md).
