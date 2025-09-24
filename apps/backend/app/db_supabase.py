# apps/backend/db_supabase.py
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # server-side only
_sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_app_by_id(application_id: str):
    res = _sb.table("applications") \
        .select("*") \
        .eq("application_id", application_id) \
        .limit(1) \
        .execute()
    return res.data[0] if res.data else None

async def get_owner_by_id(owner_id: str):
    res = _sb.table("owners") \
        .select("owner_id, owner_name") \
        .eq("owner_id", owner_id) \
        .limit(1) \
        .execute()
    return res.data[0] if res.data else None

async def get_paddock_by_id(paddock_id: str):
    res = _sb.table("paddocks") \
        .select("paddock_id, paddock_name, centroid_lat, centroid_lng, created_at") \
        .eq("paddock_id", paddock_id) \
        .limit(1) \
        .execute()
    return res.data[0] if res.data else None
