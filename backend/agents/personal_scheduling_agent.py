import os
import json
from datetime import datetime
from calendar_service.availability_store import get_availability

def _get_gemini_client(api_key: str | None = None):
    api_key = api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        from google import genai
    except ImportError:
        return None

    return genai.Client(api_key=api_key)

class PersonalSchedulingAgent:

    def __init__(
        self,
        user_id: str,
        display_name: str,
        scheduling_style: str,
        enable_ai: bool = False,
        ai_api_key: str | None = None
    ):
        self.user_id = user_id
        self.display_name = display_name
        self.scheduling_style = scheduling_style
        self.enable_ai = enable_ai
        self.ai_api_key = ai_api_key

    def _get_style_description(self) -> str:
        descriptions = {
            "early": (
                "You strongly prefer the earliest "
                "available time slots. Always evaluate "
                "proposed slots in chronological order "
                "and accept the first one that works. "
                "When countering, suggest the earliest "
                "available slots from your calendar."
            ),
            "balanced": (
                "You prefer time slots that have the "
                "most free time surrounding them. "
                "Avoid slots that are sandwiched between "
                "other meetings. When countering, suggest "
                "slots with the most breathing room."
            ),
            "flexible": (
                "You prefer slots that are furthest from "
                "other meetings and in less dense parts "
                "of the calendar. You are willing to "
                "schedule further in the future to find "
                "a better slot. When countering, suggest "
                "slots in low-density periods."
            )
        }
        return descriptions.get(
            self.scheduling_style,
            descriptions["balanced"]
        )

    def _build_system_prompt(
        self,
        free_slots: list
    ) -> str:
        return f"""You are a personal scheduling agent 
for {self.display_name}.

Your scheduling style is {self.scheduling_style}:
{self._get_style_description()}

Your user's available time slots are:
{json.dumps(free_slots, indent=2)}

Your job is to evaluate meeting proposals and respond 
with the best decision for your user.

DECISION RULES:
- ACCEPT if any proposed slot matches your availability
- COUNTER if no proposed slot works but you have alternatives
- REJECT if no slots work and you have no alternatives

You must ALWAYS respond with ONLY a valid JSON object 
in exactly this format with no additional text, 
no markdown, no explanation outside the JSON:

{{
    "decision": "ACCEPT" or "COUNTER" or "REJECT",
    "accepted_slot": {{
        "start": "ISO datetime string",
        "end": "ISO datetime string"
    }} or null,
    "counter_slots": [
        {{
            "start": "ISO datetime string",
            "end": "ISO datetime string"
        }}
    ],
    "reasoning": "One clear sentence explaining your decision"
    }}"""

    def _rank_slots(self, slots: list) -> list:
        reverse = self.scheduling_style == "flexible"
        return sorted(
            slots,
            key=lambda slot: slot.get("start", ""),
            reverse=reverse
        )

    def _slot_works(self, proposal: dict, free_slot: dict) -> bool:
        try:
            proposal_start = datetime.fromisoformat(
                proposal["start"]
            )
            proposal_end = datetime.fromisoformat(
                proposal["end"]
            )
            free_start = datetime.fromisoformat(
                free_slot["start"]
            )
            free_end = datetime.fromisoformat(
                free_slot["end"]
            )
        except (KeyError, TypeError, ValueError):
            return False

        return free_start <= proposal_start and proposal_end <= free_end

    def _evaluate_without_ai(
        self,
        proposals: list,
        free_slots: list
    ) -> dict:
        ranked_free_slots = self._rank_slots(free_slots)

        for proposal in proposals:
            for free_slot in ranked_free_slots:
                if self._slot_works(proposal, free_slot):
                    return {
                        "decision": "ACCEPT",
                        "accepted_slot": {
                            "start": proposal["start"],
                            "end": proposal["end"]
                        },
                        "counter_slots": [],
                        "reasoning": (
                            "The proposed slot fits the user's "
                            "available calendar window."
                        )
                    }

        counter_slots = [
            {
                "start": slot["start"],
                "end": slot["end"]
            }
            for slot in ranked_free_slots[:3]
        ]
        if counter_slots:
            return {
                "decision": "COUNTER",
                "accepted_slot": None,
                "counter_slots": counter_slots,
                "reasoning": (
                    "None of the proposed slots fit, so the "
                    "agent suggested available alternatives."
                )
            }

        return {
            "decision": "REJECT",
            "accepted_slot": None,
            "counter_slots": [],
            "reasoning": "No available alternatives were found."
        }

    def evaluate_proposals(
        self,
        proposals: list,
        session_id: str,
        meeting_duration: int,
        meeting_title: str
    ) -> dict:

        free_slots = get_availability(
            self.user_id,
            session_id
        )

        if not free_slots:
            return {
                "decision": "REJECT",
                "accepted_slot": None,
                "counter_slots": [],
                "reasoning": (
                    f"No availability data found "
                    f"for {self.display_name}"
                )
            }

        full_prompt = f"""{self._build_system_prompt(free_slots)}

Please evaluate these meeting proposals for 
"{meeting_title}" ({meeting_duration} minutes):

{json.dumps(proposals, indent=2)}

Check each proposed slot against your available 
times and respond with your decision."""

        client = _get_gemini_client(
            self.ai_api_key
        ) if self.enable_ai else None
        if not client:
            return self._evaluate_without_ai(
                proposals,
                free_slots
            )

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt
            )

            response_text = response.text

            clean_response = response_text\
                .replace("```json", "")\
                .replace("```", "")\
                .strip()

            decision = json.loads(clean_response)

            required_fields = [
                "decision",
                "accepted_slot",
                "counter_slots",
                "reasoning"
            ]
            for field in required_fields:
                if field not in decision:
                    raise ValueError(
                        f"Missing field: {field}"
                    )

            return decision

        except json.JSONDecodeError as e:
            return {
                "decision": "REJECT",
                "accepted_slot": None,
                "counter_slots": [],
                "reasoning": (
                    f"Agent response parsing failed: "
                    f"{str(e)}"
                )
            }
        except Exception as e:
            return {
                "decision": "REJECT",
                "accepted_slot": None,
                "counter_slots": [],
                "reasoning": f"Agent error: {str(e)}"
            }
