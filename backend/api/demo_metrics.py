import os
from datetime import datetime, timezone
from hashlib import sha256

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import get_db

router = APIRouter()
LOCAL_LOVE_EVENTS: list[str] = []


class DemoLoveRequest(BaseModel):
    device_id: str = Field(..., min_length=8, max_length=128)


def _hash_device_id(device_id: str) -> str:
    normalized = device_id.strip().lower()
    return sha256(normalized.encode("utf-8")).hexdigest()


def _local_response(device_hash: str | None = None, *, count_device: bool = False) -> dict:
    if device_hash and count_device:
        LOCAL_LOVE_EVENTS.append(device_hash)

    return {
        "count": len(LOCAL_LOVE_EVENTS),
        "loved": bool(device_hash and device_hash in LOCAL_LOVE_EVENTS),
        "storage": "temporary_demo",
    }


def _requires_persistent_storage() -> bool:
    explicit = os.environ.get("DEMO_LOVE_REQUIRE_PERSISTENCE", "").strip().lower()
    if explicit in {"1", "true", "yes"}:
        return True

    return any(
        os.environ.get(name)
        for name in ("RENDER", "RENDER_SERVICE_ID", "RENDER_EXTERNAL_URL")
    )


def _fallback_or_raise(
    device_hash: str | None = None,
    *,
    count_device: bool = False,
    exc: Exception | None = None,
) -> dict:
    if _requires_persistent_storage():
        raise HTTPException(
            status_code=503,
            detail=(
                "Persistent demo love storage is not configured. "
                "Set SUPABASE_URL and SUPABASE_KEY, then create "
                "the demo_love_events table."
            ),
        ) from exc

    return _local_response(device_hash, count_device=count_device)


def _supabase_count(db) -> int:
    response = db.table("demo_love_events").select("id", count="exact").execute()
    return response.count if response.count is not None else len(response.data or [])


def _supabase_has_device(db, device_hash: str | None) -> bool:
    if not device_hash:
        return False

    response = (
        db.table("demo_love_events")
        .select("id")
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
    except Exception as exc:
        return _fallback_or_raise(device_hash, exc=exc)


@router.post("/demo/love")
def register_demo_love(req: DemoLoveRequest):
    device_hash = _hash_device_id(req.device_id)
    try:
        db = get_db()
        db.table("demo_love_events").insert(
            {
                "device_hash": device_hash,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        ).execute()
        return {
            "count": _supabase_count(db),
            "loved": True,
            "storage": "supabase",
        }
    except Exception as exc:
        return _fallback_or_raise(device_hash, count_device=True, exc=exc)
