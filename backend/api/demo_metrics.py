from datetime import datetime, timezone
from hashlib import sha256

from fastapi import APIRouter
from pydantic import BaseModel, Field

from database import get_db

router = APIRouter()
LOCAL_LOVE_DEVICES: set[str] = set()


class DemoLoveRequest(BaseModel):
    device_id: str = Field(..., min_length=8, max_length=128)


def _hash_device_id(device_id: str) -> str:
    normalized = device_id.strip().lower()
    return sha256(normalized.encode("utf-8")).hexdigest()


def _local_response(device_hash: str | None = None, *, count_device: bool = False) -> dict:
    if device_hash and count_device:
        LOCAL_LOVE_DEVICES.add(device_hash)

    return {
        "count": len(LOCAL_LOVE_DEVICES),
        "loved": bool(device_hash and device_hash in LOCAL_LOVE_DEVICES),
        "storage": "temporary_demo",
    }


def _supabase_count(db) -> int:
    response = db.table("demo_love_devices").select("device_hash", count="exact").execute()
    return response.count if response.count is not None else len(response.data or [])


def _supabase_has_device(db, device_hash: str | None) -> bool:
    if not device_hash:
        return False

    response = (
        db.table("demo_love_devices")
        .select("device_hash")
        .eq("device_hash", device_hash)
        .limit(1)
        .execute()
    )
    return bool(response.data)


@router.get("/demo/love")
def get_demo_love_count(device_id: str | None = None):
    device_hash = _hash_device_id(device_id) if device_id else None
    try:
        db = get_db()
        return {
            "count": _supabase_count(db),
            "loved": _supabase_has_device(db, device_hash),
            "storage": "supabase",
        }
    except Exception:
        return _local_response(device_hash)


@router.post("/demo/love")
def register_demo_love(req: DemoLoveRequest):
    device_hash = _hash_device_id(req.device_id)
    try:
        db = get_db()
        db.table("demo_love_devices").upsert(
            {
                "device_hash": device_hash,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="device_hash",
        ).execute()
        return {
            "count": _supabase_count(db),
            "loved": True,
            "storage": "supabase",
        }
    except Exception:
        return _local_response(device_hash, count_device=True)
