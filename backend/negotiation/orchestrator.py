import json
from datetime import datetime
from typing import List, Dict, Optional
from agents.host_agent import HostAgent
from agents.personal_scheduling_agent import (
    PersonalSchedulingAgent
)
from calendar_service.availability_store import (
    store_availability,
    get_availability
)
from calendar_service.mock_generator import (
    generate_mock_busy_blocks
)
from calendar_service.free_slot_calculator import (
    get_free_slots
)

MAX_ROUNDS = 3

class NegotiationOrchestrator:

    def __init__(
        self,
        session_id: str,
        meeting_title: str,
        duration_minutes: int,
        date_range_start: str,
        date_range_end: str
    ):
        self.session_id = session_id
        self.meeting_title = meeting_title
        self.duration_minutes = duration_minutes
        self.date_range_start = date_range_start
        self.date_range_end = date_range_end
        self.negotiation_logs = {}
        self.current_round = 0

    def _setup_agent_availability(
        self,
        user_id: str,
        use_mock: bool = True
    ):
        busy_blocks = generate_mock_busy_blocks(
            user_id=user_id,
            date_range_start=self.date_range_start,
            date_range_end=self.date_range_end,
            density="medium"
        )
        free_slots = get_free_slots(
            busy_blocks=busy_blocks,
            date_range_start=self.date_range_start,
            date_range_end=self.date_range_end,
            duration_minutes=self.duration_minutes
        )
        store_availability(
            user_id,
            self.session_id,
            free_slots
        )
        return free_slots

    def _check_consensus(
        self,
        proposals: List[Dict],
        responses: Dict
    ) -> Optional[Dict]:

        for proposal in proposals:
            all_accepted = True
            for user_id, response in responses.items():
                if response["decision"] == "ACCEPT":
                    accepted = response.get(
                        "accepted_slot", {}
                    )
                    if accepted and (
                        accepted.get("start") == 
                        proposal.get("start")
                    ):
                        continue
                all_accepted = False
                break

            if all_accepted and len(responses) > 0:
                return proposal

        return None

    def _find_best_consensus(
        self,
        proposals: List[Dict],
        responses: Dict
    ) -> Optional[Dict]:

        acceptance_count = {}

        for user_id, response in responses.items():
            if response["decision"] == "ACCEPT":
                accepted = response.get(
                    "accepted_slot", {}
                )
                if accepted:
                    slot_key = accepted.get("start")
                    if slot_key:
                        acceptance_count[slot_key] = \
                            acceptance_count.get(
                                slot_key, 0
                            ) + 1

        if not acceptance_count:
            return None

        best_slot_start = max(
            acceptance_count,
            key=acceptance_count.get
        )

        for proposal in proposals:
            if proposal.get("start") == best_slot_start:
                return proposal

        return None

    def run_negotiation(
        self,
        host_user_id: str,
        host_display_name: str,
        host_scheduling_style: str,
        invitees: List[Dict]
    ) -> Dict:

        self._setup_agent_availability(host_user_id)

        for invitee in invitees:
            self._setup_agent_availability(
                invitee["user_id"]
            )

        host = HostAgent(
            user_id=host_user_id,
            display_name=host_display_name,
            scheduling_style=host_scheduling_style
        )

        invitee_agents = []
        for invitee in invitees:
            agent = PersonalSchedulingAgent(
                user_id=invitee["user_id"],
                display_name=invitee["display_name"],
                scheduling_style=invitee[
                    "scheduling_style"
                ]
            )
            invitee_agents.append(agent)

        current_proposals = []
        previous_responses = []

        for round_num in range(1, MAX_ROUNDS + 1):
            self.current_round = round_num
            print(f"\n--- Round {round_num} ---")

            if round_num == 1:
                current_proposals = \
                    host.generate_initial_proposals(
                        session_id=self.session_id,
                        meeting_duration=\
                            self.duration_minutes,
                        meeting_title=self.meeting_title,
                        num_proposals=3
                    )
            else:
                current_proposals = host.refine_proposals(
                    session_id=self.session_id,
                    previous_responses=previous_responses,
                    meeting_duration=self.duration_minutes,
                    meeting_title=self.meeting_title,
                    num_proposals=3
                )

            print(f"Host proposals: {current_proposals}")

            round_responses = {}
            for agent in invitee_agents:
                response = agent.evaluate_proposals(
                    proposals=current_proposals,
                    session_id=self.session_id,
                    meeting_duration=self.duration_minutes,
                    meeting_title=self.meeting_title
                )
                round_responses[agent.user_id] = response
                print(
                    f"{agent.display_name} decision: "
                    f"{response['decision']} - "
                    f"{response['reasoning']}"
                )

            self.negotiation_logs[
                f"round_{round_num}"
            ] = {
                "proposals": current_proposals,
                "responses": round_responses
            }

            previous_responses = [
                {
                    "user_id": uid,
                    "response": resp
                }
                for uid, resp in round_responses.items()
            ]

            consensus_slot = self._check_consensus(
                current_proposals,
                round_responses
            )

            if consensus_slot:
                print(
                    f"✅ Consensus reached in "
                    f"round {round_num}"
                )
                self.negotiation_logs[
                    "final_result"
                ] = "CONSENSUS"
                self.negotiation_logs[
                    "agreed_slot"
                ] = consensus_slot
                self.negotiation_logs[
                    "rounds_completed"
                ] = round_num

                return {
                    "status": "CONSENSUS",
                    "agreed_slot": consensus_slot,
                    "rounds_completed": round_num,
                    "negotiation_logs": \
                        self.negotiation_logs
                }

        best_slot = self._find_best_consensus(
            current_proposals,
            round_responses
        )

        if best_slot:
            print("⚠️ Partial consensus reached")
            self.negotiation_logs[
                "final_result"
            ] = "PARTIAL_CONSENSUS"
            self.negotiation_logs[
                "agreed_slot"
            ] = best_slot
            self.negotiation_logs[
                "rounds_completed"
            ] = MAX_ROUNDS

            return {
                "status": "PARTIAL_CONSENSUS",
                "agreed_slot": best_slot,
                "rounds_completed": MAX_ROUNDS,
                "negotiation_logs": \
                    self.negotiation_logs
            }

        # Complete failure
        print("❌ No consensus reached")
        self.negotiation_logs[
            "final_result"
        ] = "NO_CONSENSUS"
        self.negotiation_logs[
            "rounds_completed"
        ] = MAX_ROUNDS

        return {
            "status": "NO_CONSENSUS",
            "agreed_slot": None,
            "rounds_completed": MAX_ROUNDS,
            "negotiation_logs": self.negotiation_logs
        }