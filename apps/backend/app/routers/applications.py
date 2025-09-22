from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Application, ApplicationPaddock
from ..pdf import generate_application_pdf
from ..schemas import ApplicationCreate, ApplicationResponse
from ..services.serializers import serialize_application
from ..services.ownership import ensure_application, ensure_paddock

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


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def start_application(
    payload: ApplicationCreate,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> ApplicationResponse:
    if not payload.paddocks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one paddock is required")

    started_at = payload.started_at or datetime.now(timezone.utc)
    application = Application(
        owner_id=auth.owner_id,
        mix_id=payload.mix_id,
        operator_user_id=payload.operator_user_id or auth.user_id,
        started_at=started_at,
        notes=payload.notes,
        water_source=payload.water_source,
        created_at=datetime.now(timezone.utc),
    )
    session.add(application)
    await session.flush()

    for paddock_payload in payload.paddocks:
        paddock = await ensure_paddock(session, paddock_payload.paddock_id, auth.owner_id)
        gps_captured_at = None
        if paddock_payload.gps_lat is not None and paddock_payload.gps_lng is not None:
            gps_captured_at = datetime.now(timezone.utc)
        link = ApplicationPaddock(
            owner_id=auth.owner_id,
            application_id=application.id,
            paddock_id=paddock.id,
            gps_latitude=paddock_payload.gps_lat,
            gps_longitude=paddock_payload.gps_lng,
            gps_accuracy_m=paddock_payload.gps_accuracy_m,
            gps_captured_at=gps_captured_at,
        )
        session.add(link)
    await session.commit()
    await session.refresh(application)
    application = await _load_application(session, application.id, auth.owner_id)
    return serialize_application(application)


@router.post("/{application_id}/finalize", response_model=ApplicationResponse)
async def finalize_application(
    application_id: uuid.UUID,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> ApplicationResponse:
    application = await ensure_application(session, application_id, auth.owner_id)
    if application.finalized:
        return serialize_application(await _load_application(session, application_id, auth.owner_id))

    finished_at = datetime.now(timezone.utc)
    await session.execute(
        update(Application)
        .where(Application.id == application_id, Application.owner_id == auth.owner_id)
        .values(finalized=True, finished_at=finished_at)
    )
    await session.commit()
    application = await _load_application(session, application_id, auth.owner_id)
    return serialize_application(application)


@router.get("/{application_id}/export.pdf", response_class=Response)
async def export_application_pdf(
    application_id: uuid.UUID,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    application = await _load_application(session, application_id, auth.owner_id)
    pdf_bytes = generate_application_pdf(application)
    filename = f"application-{application_id}.pdf"
    headers = {"Content-Disposition": f"inline; filename=\"{filename}\""}
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
