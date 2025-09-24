from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Application, ApplicationPaddock
from ..pdf import generate_application_pdf
from ..schemas import ApplicationCreate, ApplicationPaddockPayload, ApplicationSummary
from ..services.serializers import serialize_application_summary
from ..services.ownership import ensure_application, ensure_paddock
from ..config import get_settings

router = APIRouter(prefix="/api/applications", tags=["applications"])


async def _load_application(session: AsyncSession, application_id: uuid.UUID, owner_id: uuid.UUID) -> Application:
    query = (
        select(Application)
        .where(Application.id == application_id, Application.owner_id == owner_id)
        .options(
            selectinload(Application.paddocks).selectinload(ApplicationPaddock.paddock),
            selectinload(Application.owner),
        )
    )
    result = await session.execute(query)
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


@router.get("", response_model=list[ApplicationSummary])
async def list_applications(
    owner_id: uuid.UUID | None = Query(default=None),
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[ApplicationSummary]:
    if owner_id is not None and owner_id != auth.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access applications for another owner")

    target_owner_id = owner_id or auth.owner_id

    query = (
        select(Application)
        .where(Application.owner_id == target_owner_id)
        .options(selectinload(Application.paddocks))
        .order_by(Application.started_at.desc())
    )
    result = await session.execute(query)
    applications = result.scalars().all()
    return [serialize_application_summary(application) for application in applications]


@router.post("", response_model=ApplicationSummary, status_code=status.HTTP_201_CREATED)
async def start_application(
    payload: ApplicationCreate,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> ApplicationSummary:
    owner_id = payload.owner_id or auth.owner_id
    if owner_id != auth.owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot create application for another owner")

    paddock_payloads: list[ApplicationPaddockPayload] | None = payload.paddocks
    if not paddock_payloads and payload.paddock_ids:
        paddock_payloads = [ApplicationPaddockPayload(paddock_id=pid) for pid in payload.paddock_ids]

    if not paddock_payloads:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one paddock is required")

    started_at = payload.started_at or datetime.now(timezone.utc)
    application = Application(
        owner_id=owner_id,
        mix_id=payload.mix_id,
        operator_user_id=payload.operator_user_id or auth.user_id,
        started_at=started_at,
        notes=payload.notes,
        water_source=payload.water_source,
        created_at=datetime.now(timezone.utc),
    )
    session.add(application)
    await session.flush()

    for p in paddock_payloads:
        await ensure_paddock(session, p.paddock_id, owner_id)
        gps_captured_at = None
        if p.gps_lat is not None and p.gps_lng is not None:
            gps_captured_at = datetime.now(timezone.utc)
        link = ApplicationPaddock(
            owner_id=owner_id,
            application_id=application.id,
            paddock_id=p.paddock_id,
            gps_latitude=p.gps_lat,
            gps_longitude=p.gps_lng,
            gps_accuracy_m=p.gps_accuracy_m,
            gps_captured_at=gps_captured_at,
        )
        session.add(link)

    await session.commit()
    application = await _load_application(session, application.id, owner_id)
    return serialize_application_summary(application)


@router.post("/{application_id}/finalize", response_model=ApplicationSummary)
async def finalize_application(
    application_id: uuid.UUID,
    response: Response,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> ApplicationSummary:
    # 1) Ensure we own it
    application = await ensure_application(session, application_id, auth.owner_id)

    # 2) Render PDF
    try:
        pdf_bytes = generate_application_pdf(application)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF render failed: {e!s}")

    # 3) Upload to Supabase via REST (upsert)
    import httpx  # ensure httpx is in requirements.txt
    settings = get_settings()
    bucket = settings.supabase_bucket
    if not bucket:
        raise HTTPException(status_code=500, detail="SUPABASE_BUCKET not configured")

    key = f"applications/{application_id}/application-{application_id}.pdf"
    upload_url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{key}"
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/pdf",
        "x-upsert": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(upload_url, content=pdf_bytes, headers=headers)
            if r.status_code not in (200, 201):
                raise HTTPException(status_code=500, detail=f"Storage upload failed: {r.status_code} {r.text}")

            # If bucket is PUBLIC:
            pdf_url = f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{key}"

            # If bucket is PRIVATE, use this instead:
            # sign_url = f"{settings.supabase_url}/storage/v1/object/sign/{bucket}/{key}"
            # rs = await client.post(sign_url, headers={
            #     "Authorization": f"Bearer {settings.supabase_service_role_key}",
            #     "Content-Type": "application/json",
            # }, json={"expiresIn": 60 * 60 * 24})
            # if rs.status_code != 200:
            #     raise HTTPException(status_code=500, detail=f"Sign URL failed: {rs.status_code} {rs.text}")
            # pdf_url = settings.supabase_url + rs.json()["signedURL"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e!s}")

    # 4) Mark finalized
    finished_at = datetime.now(timezone.utc)
    await session.execute(
        update(Application)
        .where(Application.id == application_id, Application.owner_id == auth.owner_id)
        .values(finalized=True, finished_at=finished_at)
    )
    await session.commit()

    # 5) Return fresh summary & expose URL in a header
    application = await _load_application(session, application_id, auth.owner_id)
    response.headers["X-PDF-URL"] = pdf_url
    return serialize_application_summary(application)


@router.get("/{application_id}/export.pdf", response_class=Response)
async def export_application_pdf(
    application_id: uuid.UUID,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    application = await _load_application(session, application_id, auth.owner_id)
    pdf_bytes = generate_application_pdf(application)
    filename = f"application-{application_id}.pdf"
    headers = {"Content-Disposition": f'inline; filename="{filename}"'}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
