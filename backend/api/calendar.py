from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from calendar_service.mock_generator import generate_mock_busy_blocks
from calendar_service.free_slot_calculator import get_free_slots
from calendar_service.availability_store import store_availability, get_availability

router = APIRouter()

class AvailabilityRequest(BaseModel):
    user_id: str
    session_id: str
    date_range_start: str
    date_range_end: str
    duration_minutes: int
    density: Optional[str] = "medium"
    busy_blocks: Optional[List[dict]] = None


def _validate_availability_request(req: AvailabilityRequest) -> None:
    if req.duration_minutes <= 0:
        raise HTTPException(
            status_code=400,
            detail="duration_minutes must be greater than 0"
        )

    if req.density not in {"light", "medium", "heavy"}:
        raise HTTPException(
            status_code=400,
            detail="density must be one of: light, medium, heavy"
        )


@router.post("/calendar/availability")
def fetch_and_calculate_slots(req: AvailabilityRequest):
    try:
        _validate_availability_request(req)

        if req.busy_blocks is not None:
            busy_blocks = req.busy_blocks
            availability_source = "calendar"
        else:
            busy_blocks = generate_mock_busy_blocks(
                req.user_id,
                req.date_range_start,
                req.date_range_end,
                req.density
            )
            availability_source = "mock"
        
        # 2. Calculate free slots
        free_slots = get_free_slots(
            busy_blocks,
            req.date_range_start,
            req.date_range_end,
            req.duration_minutes
        )
        
        # 3. Store in memory for later negotiation
        store_availability(req.user_id, req.session_id, free_slots)
        
        return {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "availability_source": availability_source,
            "slots_count": len(free_slots),
            "free_slots": free_slots
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/calendar/availability/{user_id}/{session_id}")
def get_cached_slots(user_id: str, session_id: str):
    slots = get_availability(user_id, session_id)
    if not slots:
        raise HTTPException(
            status_code=404,
            detail="No slots found for this session"
        )
    return {
        "user_id": user_id,
        "session_id": session_id,
        "free_slots": slots
    }
