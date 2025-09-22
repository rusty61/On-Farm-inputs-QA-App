from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import applications, farms, owners, paddocks, records, weather


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure JWKS cache warms up lazily on first request; nothing needed here yet.
    yield


settings = get_settings()
app = FastAPI(title="Infield Spray Record API", lifespan=lifespan)

if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


app.include_router(owners.router)
app.include_router(farms.router)
app.include_router(paddocks.router)
app.include_router(applications.router)
app.include_router(records.router)
app.include_router(weather.router)
