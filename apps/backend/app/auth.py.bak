from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import algorithms
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .db import get_db_session
from .models import Profile


@dataclass
class AuthContext:
    user_id: uuid.UUID
    owner_id: uuid.UUID
    is_dev: bool
    token_claims: dict[str, object] | None = None


class JWKSVerifier:
    def __init__(self, jwks_url: str, cache_ttl_seconds: int, expected_aud: str | None) -> None:
        self._jwks_url = jwks_url
        self._cache_ttl = cache_ttl_seconds
        self._expected_aud = expected_aud
        self._jwks: dict[str, dict[str, object]] | None = None
        self._cache_expiry: datetime | None = None
        self._lock = asyncio.Lock()

    async def _refresh(self) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self._jwks_url)
            response.raise_for_status()
            data = response.json()
        keys = data.get("keys", [])
        self._jwks = {str(key["kid"]): key for key in keys if "kid" in key}
        self._cache_expiry = datetime.now(timezone.utc) + timedelta(seconds=self._cache_ttl)

    async def _get_key(self, kid: str) -> dict[str, object]:
        async with self._lock:
            now = datetime.now(timezone.utc)
            if not self._jwks or not self._cache_expiry or now >= self._cache_expiry:
                await self._refresh()
            if not self._jwks:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="JWKS unavailable")
            key = self._jwks.get(kid)
            if key is None:
                # Force refresh once more in case keys rotated
                await self._refresh()
                key = self._jwks.get(kid) if self._jwks else None
            if key is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")
            return key

    async def verify(self, token: str) -> dict[str, object]:
        try:
            headers = jwt.get_unverified_header(token)
        except jwt.PyJWTError as exc:  # type: ignore[attr-defined]
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token header") from exc
        kid = headers.get("kid")
        if not kid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing key id")
        key_dict = await self._get_key(str(kid))
        key = algorithms.RSAAlgorithm.from_jwk(json.dumps(key_dict))
        audience = self._expected_aud or None
        try:
            payload: dict[str, object] = jwt.decode(
                token,
                key=key,
                algorithms=[str(key_dict.get("alg", "RS256"))],
                audience=audience,
                options={"verify_aud": audience is not None},
            )
        except jwt.PyJWTError as exc:  # type: ignore[attr-defined]
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
        return payload


settings = get_settings()
_verifier = JWKSVerifier(
    jwks_url=str(settings.supabase_jwks_url),
    cache_ttl_seconds=settings.jwks_cache_ttl_seconds,
    expected_aud=settings.supabase_expected_aud or None,
)


async def _owner_from_profiles(session: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
    result = await session.execute(select(Profile.owner_id).where(Profile.user_id == user_id))
    owner_id = result.scalar_one_or_none()
    if not owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile not linked to owner")
    return owner_id


async def get_current_auth(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> AuthContext:
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        claims = await _verifier.verify(token)
        sub = claims.get("sub")
        if not sub:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject")
        try:
            user_id = uuid.UUID(str(sub))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id") from exc
        owner_id = await _owner_from_profiles(session, user_id)
        return AuthContext(user_id=user_id, owner_id=owner_id, is_dev=False, token_claims=claims)

    dev_user = request.headers.get("X-Dev-User-Id")
    dev_owner = request.headers.get("X-Dev-Owner-Id")
    if dev_user and dev_owner:
        try:
            user_id = uuid.UUID(dev_user)
            owner_id = uuid.UUID(dev_owner)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid dev headers") from exc
        return AuthContext(user_id=user_id, owner_id=owner_id, is_dev=True, token_claims=None)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
