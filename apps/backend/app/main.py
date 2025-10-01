import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Infield Spray Record API",
    description="API for managing spray application records for QA audits",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://*.bolt.new",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/")
def root():
    return {
        "name": "Infield Spray Record API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


# Try to attach routers, but don't crash the process if something is misconfigured.
try:
    from .routers import applications, farms, mixes, owners, paddocks, records, weather

    app.include_router(applications.router)
    app.include_router(records.router)
    app.include_router(farms.router)
    app.include_router(paddocks.router)
    app.include_router(owners.router)
    app.include_router(mixes.router)
    app.include_router(weather.router)
except Exception as e:
    logging.getLogger("uvicorn.error").warning(f"Routers not attached at startup: {e}")
