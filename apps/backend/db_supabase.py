"""Supabase client helpers used by the FastAPI service."""
from __future__ import annotations

import os
from typing import Any, Optional

from supabase import Client, create_client


def _getenv(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Environment variable {key} is required")
    return value


SUPABASE_URL = _getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
if not SUPABASE_KEY:
    raise RuntimeError("Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "infield-spray-records")

_client: Client | None = None


def get_client() -> Client:
    """Return a singleton Supabase client."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


def fetch_application(application_id: str) -> Optional[dict[str, Any]]:
    client = get_client()
    response = (
        client.table("applications")
        .select("*")
        .eq("application_id", application_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def fetch_owner(owner_id: str) -> Optional[dict[str, Any]]:
    client = get_client()
    response = (
        client.table("owners")
        .select("*")
        .eq("owner_id", owner_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def fetch_paddock(paddock_id: str) -> Optional[dict[str, Any]]:
    client = get_client()
    response = (
        client.table("paddocks")
        .select("*")
        .eq("paddock_id", paddock_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def upload_pdf(storage_path: str, pdf_bytes: bytes) -> None:
    client = get_client()
    bucket = client.storage.from_(SUPABASE_BUCKET)
    bucket.upload(
        storage_path,
        pdf_bytes,
        {"content_type": "application/pdf", "upsert": True},
    )


def get_public_url(storage_path: str) -> Optional[str]:
    client = get_client()
    bucket = client.storage.from_(SUPABASE_BUCKET)
    result = bucket.get_public_url(storage_path)
    if isinstance(result, dict):
        return result.get("publicUrl") or result.get("public_url")
    return result


def mark_application_finalized(application_id: str, *, pdf_url: Optional[str], pdf_storage_path: str) -> Optional[dict[str, Any]]:
    client = get_client()
    payload: dict[str, Any] = {
        "finalized": True,
        "pdf_url": pdf_url or pdf_storage_path,
    }

    response = (
        client.table("applications")
        .update(payload)
        .eq("application_id", application_id)
        .execute()
    )
    return response.data[0] if response.data else None
