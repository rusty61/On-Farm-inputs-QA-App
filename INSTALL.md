diff --git a//dev/null b/INSTALL.md
index 0000000000000000000000000000000000000000..fc9a46b623504d707b16dbed4cf73444e0f95c7e 100644
--- a//dev/null
+++ b/INSTALL.md
@@ -0,0 +1,203 @@
+# Installation & Deployment Guide
+
+This document walks through the complete setup for the Infield Spray Record stack — Supabase (Postgres + Auth), the FastAPI backend, and the Next.js frontend — so that a new contributor can go from cloning the repository to running everything locally and deploying to Vercel + Render. The guide complements the project overview in [README.md](README.md).
+
+> **Repository layout.** Once the application source lands in the repo you should see the following high-level directories:
+>
+> ```text
+> .
+> ├── backend/           # FastAPI service (Render deployable)
+> ├── frontend/          # Next.js 14 app (Vercel deployable)
+> ├── supabase/          # SQL migrations, seeds, and policy scripts
+> ├── docs/              # Design brief, risk register, etc.
+> ├── README.md
+> └── INSTALL.md         # (this file)
+> ```
+>
+> If you only have the documentation skeleton, pull the latest `main` branch to fetch the backend/front-end scaffolds before proceeding.
+
+---
+
+## 1. Prerequisites
+
+### Accounts & services
+| Purpose | Account |
+|---------|---------|
+| Database + Auth | [Supabase](https://supabase.com) project (free tier is fine) |
+| Frontend hosting | [Vercel](https://vercel.com) account with GitHub integration |
+| Backend hosting | [Render](https://render.com) account (Web Service) |
+| Weather webhook (optional) | [Blynk](https://blynk.io) account + device token |
+
+### Local tooling
+| Tool | Version / Notes |
+|------|-----------------|
+| Git | Latest |
+| Node.js | v20.x LTS (use `nvm` or `fnm` to match the project `.nvmrc` once committed) |
+| npm (or pnpm) | npm ≥ 9 ships with Node 20; pnpm works if the frontend scripts adopt it |
+| Python | 3.11.x (Render defaults to 3.11, matching FastAPI support) |
+| pip / uv / virtualenv | Any environment manager to isolate backend dependencies |
+| Supabase CLI | `supabase` ≥ 1.130.2 for migrations (`brew install supabase/tap/supabase` or `npm install -g supabase`) |
+| Docker Desktop | Optional — only required if you prefer running Supabase locally |
+
+---
+
+## 2. Environment variables quick reference
+
+Keep a secure record of the secrets issued by Supabase and Blynk. The table below lists the variables the stack expects. Populate them locally in `.env` files and in the Render/Vercel dashboards for deployment.
+
+| Variable | Used by | Description / Source |
+|----------|---------|----------------------|
+| `SUPABASE_URL` | Backend | Base URL of the Supabase project (Settings → API) |
+| `SUPABASE_ANON_KEY` | Frontend | Anonymous public key used by the Next.js app |
+| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Service role key for RLS-protected operations |
+| `SUPABASE_JWT_SECRET` | Backend | JWT secret (Settings → API); must match Supabase Auth setting |
+| `DATABASE_URL` | Backend | Postgres connection string from Supabase (Settings → Database → Connection string → `psql` format) |
+| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Same as `SUPABASE_URL`, but exposed to the browser |
+| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Same as `SUPABASE_ANON_KEY`, exposed to the browser |
+| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Base URL for the FastAPI service (e.g. `http://localhost:8000` locally or Render URL in production) |
+| `FASTAPI_ENV` | Backend | Optional flag (`development`/`production`) for config modules |
+| `BLYNK_BASE_URL` | Backend | Optional; Blynk cloud base URL for weather station fetches |
+| `BLYNK_TOKEN` | Backend | Optional; Blynk device token |
+| `WEASYPRINT_BASE_URL` | Backend | Optional; absolute base URL for PDF asset resolution |
+
+> Once `.env.example` files are committed under `backend/` or `frontend/`, copy them to `.env` / `.env.local` respectively and fill in the values above.
+
+---
+
+## 3. Supabase setup
+
+1. **Create the project.**
+   1. Log in to Supabase and create a new project.
+   2. Choose the nearest region, set a strong database password, and note the generated `Project URL`, `anon` key, `service_role` key, and JWT secret from **Settings → API**.
+2. **Enable Storage (optional).** If you plan to host reference files (e.g., PDF templates) create a Storage bucket now.
+3. **Configure Auth providers.** Email/password is enabled by default. Add OAuth providers only if the frontend implements them.
+4. **Clone and link the repo.**
+   ```bash
+   git clone https://github.com/rusty61/On-Farm-inputs-QA-App.git
+   cd On-Farm-inputs-QA-App
+   supabase login                # Opens a browser window for authentication
+   supabase link --project-ref <PROJECT_REF>
+   ```
+5. **Apply migrations.**
+   - Place SQL migration files under `supabase/migrations/` (the FastAPI scaffold will ship them).
+   - Run them against the remote database:
+     ```bash
+     supabase db push                      # Creates tables, policies, and functions
+     # or, if you prefer sequential migrations:
+     supabase migration up --db-url "$DATABASE_URL"
+     ```
+   - Confirm that row-level security (RLS) policies are enabled on the tables defined in [docs/DesignBrief.md](docs/DesignBrief.md).
+6. **Seed reference data (optional).** If the repo includes seed scripts under `supabase/seed/`, run them:
+   ```bash
+   psql "$DATABASE_URL" -f supabase/seed/seed.sql
+   ```
+
+At this point Supabase is ready to serve Auth, Postgres, and Storage for both services.
+
+---
+
+## 4. Backend (FastAPI) setup
+
+> The FastAPI source lives under `backend/`. Pull the latest project state if the directory is missing.
+
+1. **Create a virtual environment and install dependencies.**
+   ```bash
+   cd backend
+   python -m venv .venv
+   source .venv/bin/activate            # Windows: `.venv\\Scripts\\activate`
+   pip install --upgrade pip
+   pip install -r requirements.txt      # requirements.txt will list FastAPI, SQLModel/SQLAlchemy, WeasyPrint, etc.
+   ```
+2. **Configure environment variables.**
+   ```bash
+   cp .env.example .env                  # once the sample file is available
+   # Then edit .env to inject the Supabase values from Section 2.
+   ```
+3. **Run database migrations (if applicable).** If the backend maintains its own migrations (e.g., Alembic for non-Supabase-managed tables) run them now.
+4. **Start the development server.**
+   ```bash
+   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
+   ```
+5. **Verify the API.** Navigate to [http://localhost:8000/docs](http://localhost:8000/docs) to view the interactive Swagger UI and confirm Supabase connectivity (login, mix creation, etc.).
+
+For background tasks (PDF rendering with WeasyPrint, webhook ingestion) ensure any required system packages (e.g., `libpango`, `libffi`) are installed locally. Render’s native environment supports them once configured in the service settings.
+
+---
+
+## 5. Frontend (Next.js) setup
+
+1. **Install dependencies.**
+   ```bash
+   cd frontend
+   npm install                            # or pnpm install / yarn install if the lockfile dictates
+   ```
+2. **Create the environment file.**
+   ```bash
+   cp .env.example .env.local             # once committed
+   ```
+   Populate `.env.local` with the values listed in Section 2. `NEXT_PUBLIC_API_BASE_URL` should point to the local FastAPI server (`http://localhost:8000`) during development.
+3. **Generate Supabase types (optional).** If the frontend uses `supabase gen types typescript --project-id <REF> --schema public`, run it after migrations to keep TypeScript definitions synchronized.
+4. **Start the dev server.**
+   ```bash
+   npm run dev
+   ```
+   The app becomes available at [http://localhost:3000](http://localhost:3000). Sign up with Supabase Auth (email/password) and walk through creating owners, farms, and spray applications.
+
+---
+
+## 6. Running the full stack locally
+
+1. Start Supabase locally (optional) with `supabase start` if you prefer a fully offline stack; otherwise use the hosted project created earlier.
+2. In separate shells run:
+   ```bash
+   # Terminal 1
+   cd backend
+   source .venv/bin/activate
+   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
+
+   # Terminal 2
+   cd frontend
+   npm run dev
+   ```
+3. Confirm the frontend is proxying authenticated requests to `http://localhost:8000/api/*` and that GPS/weather flows behave as described in [docs/DesignBrief.md](docs/DesignBrief.md).
+4. Generate a PDF via the backend endpoint (`/api/applications/{id}/export.pdf`) to verify WeasyPrint is working with your local fonts and assets.
+
+---
+
+## 7. Deployment checklist
+
+### Supabase (shared backend services)
+- Keep the database password, service role key, and JWT secret synchronized between Render and Vercel environments.
+- Enable database backups in Supabase (Project → Database → Backups) before going live.
+
+### Render (FastAPI backend)
+1. Push your changes to GitHub and connect the repository as a **Web Service** in Render.
+2. Choose the **Python 3** environment; Render detects `requirements.txt` automatically.
+3. Set the **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
+4. Add the environment variables from Section 2 in the Render dashboard (Database URL, Supabase keys, Blynk tokens, etc.).
+5. If PDF generation needs system packages, define them in a `render-build.sh` or use a Dockerfile specifying the dependencies.
+6. Trigger a deploy and confirm `/healthz` (or the root docs endpoint) returns 200.
+
+### Vercel (Next.js frontend)
+1. Import the GitHub repository into Vercel.
+2. Vercel auto-detects Next.js; keep the default build command (`npm run build`) and output directory (`.next`).
+3. Configure the **Environment Variables** tab with:
+   - `NEXT_PUBLIC_SUPABASE_URL`
+   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
+   - `NEXT_PUBLIC_API_BASE_URL` (point to the Render URL, e.g., `https://spray-api.onrender.com`)
+4. If using Supabase Auth webhooks, add `SUPABASE_JWT_SECRET` under **Server-side Environment Variables** to support ISR / server actions.
+5. Redeploy and validate that login, GPS capture, and PDF download flows work against the Render backend.
+
+### Domain & SSL
+- Assign custom domains in Vercel (frontend) and Render (backend) if required, and update CORS settings on the FastAPI application to match the production domain.
+
+---
+
+## 8. Troubleshooting & next steps
+
+- **Supabase RLS errors:** Use the Supabase dashboard SQL editor to test policies with the JWT generated by Supabase Auth, and align them with the tables documented in the design brief.
+- **WeasyPrint font or binary issues:** Ensure the deployment image includes `libpango`, `libffi`, and fonts referenced by the PDF templates.
+- **Blynk webhook failures:** Double-check the base URL/token combination and verify the FastAPI weather endpoint logs.
+- **Environment drift:** Keep `.env.example` files updated whenever new configuration keys are introduced so contributors can sync quickly.
+
+You are now ready to contribute features, run QA scenarios, and ship updates across Supabase, FastAPI, and Next.js.
