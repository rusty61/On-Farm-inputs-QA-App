from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..schemas import PaddockResponse, PaddockUpdate
from ..services.ownership import ensure_paddock
from ..services.serializers import serialize_paddock

router = APIRouter(prefix="/api/paddocks", tags=["paddocks"])


@router.patch("/{paddock_id}", response_model=PaddockResponse)
async def update_paddock(
    paddock_id: uuid.UUID,
    payload: PaddockUpdate,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> PaddockResponse:
    paddock = await ensure_paddock(session, paddock_id, auth.owner_id)
    updated = False
    if payload.name is not None:
        paddock.name = payload.name
        updated = True
    if payload.area_hectares is not None:
        paddock.area_hectares = payload.area_hectares
        updated = True
    if payload.gps_latitude is not None:
        paddock.gps_latitude = payload.gps_latitude
        updated = True
    if payload.gps_longitude is not None:
        paddock.gps_longitude = payload.gps_longitude
        updated = True
    if payload.gps_accuracy_m is not None:
        paddock.gps_accuracy_m = payload.gps_accuracy_m
        updated = True
    if updated and (payload.gps_latitude is not None or payload.gps_longitude is not None):
        paddock.gps_updated_at = datetime.now(timezone.utc)
    if not updated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    await session.commit()
    await session.refresh(paddock)
    return serialize_paddock(paddock)


@router.delete(
    "/{paddock_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_paddock(
    paddock_id: uuid.UUID,
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    paddock = await ensure_paddock(session, paddock_id, auth.owner_id)
    await session.delete(paddock)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
