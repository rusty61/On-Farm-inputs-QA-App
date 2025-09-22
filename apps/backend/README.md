# Spray Record Backend

FastAPI backend for the Infield Spray Record application. The service exposes owner-scoped REST endpoints for managing farms, paddocks, spray applications, weather snapshots, and authoritative PDF exports.

## Development setup

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e .
cp .env.example .env  # update with Supabase + project settings
uvicorn app.main:app --reload --port 8000
```

The API is documented at `http://localhost:8000/docs`. Use `X-Dev-User-Id` and `X-Dev-Owner-Id` headers while Supabase Auth wiring is in progress.
