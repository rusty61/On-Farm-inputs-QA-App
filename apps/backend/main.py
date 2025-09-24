# apps/backend/main.py
import os
from fastapi import FastAPI
from apps.backend.routes.records import router as records_router

app = FastAPI(title="Infield Spray Record Backend")
app.include_router(records_router)

# Optional: health check
@app.get("/healthz")
def healthz():
    return {"ok": True}
