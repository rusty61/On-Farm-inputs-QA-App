"""FastAPI entrypoint for the backend service."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import records

app = FastAPI(title="On-Farm Inputs QA Backend")

# Allow local development tools by default; production can tighten via env vars later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz() -> dict[str, bool]:
    """Simple health check used by Render and smoke tests."""
    return {"ok": True}


# Application routes -------------------------------------------------------
app.include_router(records.router, prefix="/applications", tags=["applications"])
