"""Routes for application previews and PDF finalisation."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates

from .. import db_supabase
from ..services import pdf as pdf_service

router = APIRouter()

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


def _build_record_url(application_id: str) -> str | None:
    base_url = os.getenv("PUBLIC_BASE_URL")
    if not base_url:
        return None
    base_url = base_url.rstrip("/")
    return f"{base_url}/applications/{application_id}/preview"


async def _fetch_application_bundle(application_id: str) -> dict[str, Any] | None:
    def _load() -> dict[str, Any] | None:
        application = db_supabase.fetch_application(application_id)
        if not application:
            return None

        owner = None
        owner_id = application.get("owner_id")
        if owner_id:
            owner = db_supabase.fetch_owner(str(owner_id))

        paddocks: list[dict[str, Any]] = []
        paddock_id = application.get("paddock_id")
        if paddock_id:
            paddock = db_supabase.fetch_paddock(str(paddock_id))
            if paddock:
                paddocks.append(paddock)

        return {"application": application, "owner": owner, "paddocks": paddocks}

    return await run_in_threadpool(_load)


@router.get("/{application_id}/preview")
async def preview_application(request: Request, application_id: str):
    bundle = await _fetch_application_bundle(application_id)
    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    context = pdf_service.build_context(
        bundle["application"],
        owner=bundle["owner"],
        paddocks=bundle["paddocks"],
        record_url=_build_record_url(application_id),
    )
    template_kwargs = pdf_service.context_to_template_kwargs(context)
    template_kwargs["request"] = request
    return templates.TemplateResponse("templates.html", template_kwargs)


def _build_storage_path(application_id: str) -> str:
    return f"applications/{application_id}/record.pdf"


@router.post("/{application_id}/finalize")
async def finalize_application(application_id: str):
    bundle = await _fetch_application_bundle(application_id)
    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    record_url = _build_record_url(application_id)
    context = pdf_service.build_context(
        bundle["application"],
        owner=bundle["owner"],
        paddocks=bundle["paddocks"],
        record_url=record_url,
    )
    pdf_bytes = await run_in_threadpool(
        pdf_service.render_pdf,
        context,
        base_url=os.getenv("PUBLIC_BASE_URL"),
    )

    storage_path = _build_storage_path(application_id)

    def _store() -> dict[str, Any]:
        db_supabase.upload_pdf(storage_path, pdf_bytes)
        public_url = db_supabase.get_public_url(storage_path)
        updated_application = db_supabase.mark_application_finalized(
            application_id,
            pdf_url=public_url,
            pdf_storage_path=storage_path,
        )
        return {"storage_path": storage_path, "public_url": public_url, "application": updated_application}

    result = await run_in_threadpool(_store)
    return JSONResponse(result)
