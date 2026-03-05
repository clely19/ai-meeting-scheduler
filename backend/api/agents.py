from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from agents.personal_scheduling_agent import (
    PersonalSchedulingAgent
)
from agents.host_agent import HostAgent
from calendar_service.availability_store import (
    store_availability
)
from calendar_service.mock_generator import (
    generate_mock_busy_blocks
)
from calendar_service.free_slot_calculator import (
    get_free_slots
)

router = APIRouter()

class AgentTestRequest(BaseModel):
    user_id: str
    display_name: str
    scheduling_style: str
    session_id: str
    meeting_title: str
    duration_minutes: int
    proposals: List[dict]
    date_range_start: str
    date_range_end: str

class HostTestRequest(BaseModel):
    user_id: str
    display_name: str
    scheduling_style: str
    session_id: str
    meeting_title: str
    duration_minutes: int
    date_range_start: str
    date_range_end: str
    num_proposals: int = 3

def setup_mock_availability(
    user_id: str,
    session_id: str,
    date_range_start: str,
    date_range_end: str,
    duration_minutes: int
):
    busy_blocks = generate_mock_busy_blocks(
        user_id=user_id,
        date_range_start=date_range_start,
        date_range_end=date_range_end,
        density="medium"
    )
    free_slots = get_free_slots(
        busy_blocks=busy_blocks,
        date_range_start=date_range_start,
        date_range_end=date_range_end,
        duration_minutes=duration_minutes
    )
    store_availability(user_id, session_id, free_slots)
    return free_slots

@router.post("/agents/test/evaluate")
def test_agent_evaluation(request: AgentTestRequest):
    try:
        setup_mock_availability(
            request.user_id,
            request.session_id,
            request.date_range_start,
            request.date_range_end,
            request.duration_minutes
        )

        agent = PersonalSchedulingAgent(
            user_id=request.user_id,
            display_name=request.display_name,
            scheduling_style=request.scheduling_style
        )

        decision = agent.evaluate_proposals(
            proposals=request.proposals,
            session_id=request.session_id,
            meeting_duration=request.duration_minutes,
            meeting_title=request.meeting_title
        )

        return {
            "agent": request.display_name,
            "scheduling_style": request.scheduling_style,
            "decision": decision
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/agents/test/host")
def test_host_proposals(request: HostTestRequest):
    try:
        free_slots = setup_mock_availability(
            request.user_id,
            request.session_id,
            request.date_range_start,
            request.date_range_end,
            request.duration_minutes
        )

        host = HostAgent(
            user_id=request.user_id,
            display_name=request.display_name,
            scheduling_style=request.scheduling_style
        )

        proposals = host.generate_initial_proposals(
            session_id=request.session_id,
            meeting_duration=request.duration_minutes,
            meeting_title=request.meeting_title,
            num_proposals=request.num_proposals
        )

        return {
            "host": request.display_name,
            "scheduling_style": request.scheduling_style,
            "generated_proposals": proposals,
            "total_available_slots": len(free_slots)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )