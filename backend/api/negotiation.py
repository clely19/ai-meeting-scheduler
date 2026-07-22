from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List
from negotiation.orchestrator import (
    NegotiationOrchestrator
)
from database import get_db

router = APIRouter()
LOCAL_DEMO_SESSIONS = {}

class InviteeModel(BaseModel):
    user_id: str
    display_name: str
    scheduling_style: str

class NegotiationRequest(BaseModel):
    host_user_id: str
    host_display_name: str
    host_scheduling_style: str
    invitees: List[InviteeModel]
    meeting_title: str
    duration_minutes: int
    date_range_start: str
    date_range_end: str
    working_hours_start: int = Field(default=9, ge=0, lt=24)
    working_hours_end: int = Field(default=18, ge=0, le=24)
    use_ai: bool = False
    participant_busy_blocks: Dict[str, List[dict]] = Field(default_factory=dict)

@router.post("/negotiation/start")
def start_negotiation(
    request: NegotiationRequest,
    x_user_gemini_key: str | None = Header(default=None)
):
    try:
        if request.use_ai and not x_user_gemini_key:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Add X-User-Gemini-Key to run the personalized "
                    "AI flow, or set use_ai to false for demo mode."
                )
            )

        db = None
        storage_warning = None
        try:
            db = get_db()
            session_response = db.table(
                "negotiation_sessions"
            ).insert({
                "host_user_id": request.host_user_id,
                "invitee_user_ids": [
                    i.user_id for i in request.invitees
                ],
                "meeting_title": request.meeting_title,
                "duration_minutes": request.duration_minutes,
                "status": "negotiating",
                "current_round": 0,
                "proposals": {},
                "negotiation_logs": {}
            }).execute()

            if not session_response.data:
                raise RuntimeError("Failed to create session")

            session_id = session_response.data[0]["id"]
        except Exception as e:
            session_id = f"demo-session-{uuid4()}"
            storage_warning = str(e)
            db = None

        orchestrator = NegotiationOrchestrator(
            session_id=session_id,
            meeting_title=request.meeting_title,
            duration_minutes=request.duration_minutes,
            date_range_start=request.date_range_start,
            date_range_end=request.date_range_end,
            enable_ai=request.use_ai,
            ai_api_key=x_user_gemini_key,
            participant_busy_blocks=request.participant_busy_blocks,
            working_hours_start=request.working_hours_start,
            working_hours_end=request.working_hours_end
        )

        result = orchestrator.run_negotiation(
            host_user_id=request.host_user_id,
            host_display_name=request.host_display_name,
            host_scheduling_style=\
                request.host_scheduling_style,
            invitees=[
                i.dict() for i in request.invitees
            ]
        )

        final_status = result["status"].lower()
        if final_status == "consensus":
            db_status = "pending_approval"
        elif final_status in [
            "partial_consensus",
            "next_available"
        ]:
            db_status = "pending_approval"
        else:
            db_status = "failed"

        session_payload = {
            "id": session_id,
            "status": db_status,
            "current_round": result["rounds_completed"],
            "final_slot": result.get("agreed_slot"),
            "negotiation_logs": result[
                "negotiation_logs"
            ]
        }

        if db is not None:
            try:
                db.table("negotiation_sessions").update({
                    "status": db_status,
                    "current_round": result["rounds_completed"],
                    "final_slot": result.get("agreed_slot"),
                    "negotiation_logs": result[
                        "negotiation_logs"
                    ]
                }).eq("id", session_id).execute()
            except Exception as e:
                storage_warning = str(e)
                LOCAL_DEMO_SESSIONS[session_id] = session_payload

        if db is None:
            LOCAL_DEMO_SESSIONS[session_id] = session_payload

        response_payload = {
            "session_id": session_id,
            "status": result["status"],
            "agreed_slot": result.get("agreed_slot"),
            "rounds_completed": result[
                "rounds_completed"
            ],
            "negotiation_logs": result[
                "negotiation_logs"
            ]
        }
        if storage_warning:
            response_payload["storage"] = "temporary_demo"
            response_payload["storage_warning"] = storage_warning

        return response_payload

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/negotiation/{session_id}")
def get_negotiation_status(session_id: str):
    if session_id in LOCAL_DEMO_SESSIONS:
        return LOCAL_DEMO_SESSIONS[session_id]

    try:
        db = get_db()
        response = db.table(
            "negotiation_sessions"
        ).select("*").eq(
            "id", session_id
        ).execute()

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Session not found"
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
