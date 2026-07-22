import os
from datetime import datetime, timezone
from hashlib import sha256
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import get_db

router = APIRouter()
LOCAL_LOVE_EVENTS: list[str] = []
LOVE_EVENT_TABLE = "demo_love_events"
LEGACY_LOVE_DEVICE_TABLE = "demo_love_devices"


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


def _supabase_count(db, table_name: str, count_column: str) -> int:
    response = db.table(table_name).select(count_column, count="exact").execute()
    return response.count if response.count is not None else len(response.data or [])


def _supabase_has_device(db, table_name: str, device_hash: str | None) -> bool:
    if not device_hash:
        return False

    response = (
        db.table(table_name)
        .select("device_hash")
        .eq("device_hash", device_hash)
        .limit(1)
        .execute()
    )
    if response.data or table_name != LEGACY_LOVE_DEVICE_TABLE:
        return bool(response.data)

    legacy_event_response = (
        db.table(table_name)
        .select("device_hash")
        .like("device_hash", f"{device_hash}:%")
        .limit(1)
        .execute()
    )
    return bool(legacy_event_response.data)


def _supabase_insert_love_event(db, table_name: str, device_hash: str) -> None:
    stored_device_hash = device_hash
    if table_name == LEGACY_LOVE_DEVICE_TABLE:
        stored_device_hash = f"{device_hash}:{uuid4().hex}"

    db.table(table_name).insert(
        {
            "device_hash": stored_device_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()


def _get_supabase_love_state(db, device_hash: str | None) -> dict:
    table_errors: list[Exception] = []
    for table_name, count_column in (
        (LOVE_EVENT_TABLE, "id"),
        (LEGACY_LOVE_DEVICE_TABLE, "device_hash"),
    ):
        try:
            return {
                "count": _supabase_count(db, table_name, count_column),
                "loved": _supabase_has_device(db, table_name, device_hash),
                "storage": f"supabase:{table_name}",
            }
        except Exception as exc:
            table_errors.append(exc)

    raise table_errors[-1]


def _register_supabase_love(db, device_hash: str) -> dict:
    table_errors: list[Exception] = []
    for table_name, count_column in (
        (LOVE_EVENT_TABLE, "id"),
        (LEGACY_LOVE_DEVICE_TABLE, "device_hash"),
    ):
        try:
            _supabase_insert_love_event(db, table_name, device_hash)
            return {
                "count": _supabase_count(db, table_name, count_column),
                "loved": True,
                "storage": f"supabase:{table_name}",
            }
        except Exception as exc:
            table_errors.append(exc)

    raise table_errors[-1]


@router.get("/demo/love")
def get_demo_love_count(device_id: str | None = None):
    device_hash = _hash_device_id(device_id) if device_id else None
    try:
        db = get_db()
        return _get_supabase_love_state(db, device_hash)
    except Exception as exc:
        return _fallback_or_raise(device_hash, exc=exc)


@router.post("/demo/love")
def register_demo_love(req: DemoLoveRequest):
    device_hash = _hash_device_id(req.device_id)
    try:
        db = get_db()
        return _register_supabase_love(db, device_hash)
    except Exception as exc:
        return _fallback_or_raise(device_hash, count_device=True, exc=exc)
