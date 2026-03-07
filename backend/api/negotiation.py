from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from negotiation.orchestrator import (
    NegotiationOrchestrator
)
from database import get_db

router = APIRouter()

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

@router.post("/negotiation/start")
def start_negotiation(request: NegotiationRequest):
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
            raise HTTPException(
                status_code=500,
                detail="Failed to create session"
            )

        session_id = session_response.data[0]["id"]

        orchestrator = NegotiationOrchestrator(
            session_id=session_id,
            meeting_title=request.meeting_title,
            duration_minutes=request.duration_minutes,
            date_range_start=request.date_range_start,
            date_range_end=request.date_range_end
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
        elif final_status == "partial_consensus":
            db_status = "pending_approval"
        else:
            db_status = "failed"

        db.table("negotiation_sessions").update({
            "status": db_status,
            "current_round": result["rounds_completed"],
            "final_slot": result.get("agreed_slot"),
            "negotiation_logs": result[
                "negotiation_logs"
            ]
        }).eq("id", session_id).execute()

        return {
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/negotiation/{session_id}")
def get_negotiation_status(session_id: str):
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