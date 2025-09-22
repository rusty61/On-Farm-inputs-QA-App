from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth import AuthContext, get_current_auth
from ..db import get_db_session
from ..models import Application, ApplicationPaddock
from ..schemas import RecordResponse
from ..services.serializers import serialize_application

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("", response_model=list[RecordResponse])
async def list_records(
    auth: AuthContext = Depends(get_current_auth),
    session: AsyncSession = Depends(get_db_session),
) -> list[RecordResponse]:
    query = (
        select(Application)
        .where(Application.owner_id == auth.owner_id)
        .options(selectinload(Application.paddocks).selectinload(ApplicationPaddock.paddock))
        .order_by(Application.started_at.desc())
    )
    result = await session.execute(query)
    applications = result.scalars().all()
    records: list[RecordResponse] = []
    for application in applications:
        paddock_names = [link.paddock.name if link.paddock else "Unknown" for link in application.paddocks]
        records.append(RecordResponse(application=serialize_application(application), paddock_names=paddock_names))
    return records
