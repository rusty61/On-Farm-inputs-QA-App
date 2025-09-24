import logging

from fastapi import FastAPI

app = FastAPI()


@app.get("/healthz")
def healthz():
    return {"ok": True}


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
