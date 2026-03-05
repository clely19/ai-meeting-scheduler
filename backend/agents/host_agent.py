import os
import json
from google import genai
from agents.personal_scheduling_agent import (
    PersonalSchedulingAgent
)
from calendar_service.availability_store import (
    get_availability
)

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY")
)

class HostAgent(PersonalSchedulingAgent):

    def __init__(
        self,
        user_id: str,
        display_name: str,
        scheduling_style: str
    ):
        super().__init__(
            user_id,
            display_name,
            scheduling_style
        )

    def generate_initial_proposals(
        self,
        session_id: str,
        meeting_duration: int,
        meeting_title: str,
        num_proposals: int = 3
    ) -> list:

        free_slots = get_availability(
            self.user_id,
            session_id
        )

        if not free_slots:
            return []

        prompt = f"""You are a host scheduling agent 
for {self.display_name}.

Your scheduling style is {self.scheduling_style}:
{self._get_style_description()}

Your available slots are:
{json.dumps(free_slots, indent=2)}

Select exactly {num_proposals} slots to propose 
for "{meeting_title}" ({meeting_duration} minutes)
based on your {self.scheduling_style} scheduling style.

Respond with ONLY a valid JSON array, no markdown,
no additional text:

[
    {{
        "start": "ISO datetime string",
        "end": "ISO datetime string"
    }}
]"""

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )

            response_text = response.text
            clean_response = response_text\
                .replace("```json", "")\
                .replace("```", "")\
                .strip()

            proposals = json.loads(clean_response)
            return proposals

        except Exception as e:
            print(f"Host agent error: {str(e)}")
            return free_slots[:num_proposals]

    def refine_proposals(
        self,
        session_id: str,
        previous_responses: list,
        meeting_duration: int,
        meeting_title: str,
        num_proposals: int = 3
    ) -> list:

        free_slots = get_availability(
            self.user_id,
            session_id
        )

        if not free_slots:
            return []

        prompt = f"""You are a host scheduling agent 
for {self.display_name}.

Your scheduling style is {self.scheduling_style}:
{self._get_style_description()}

Your available slots are:
{json.dumps(free_slots, indent=2)}

Previous round responses from invitees:
{json.dumps(previous_responses, indent=2)}

Generate {num_proposals} refined proposals for 
"{meeting_title}" ({meeting_duration} minutes)
that better address invitee availability.

Prioritize slots from invitee counter proposals
that also exist in your own available slots.

Respond with ONLY a valid JSON array:
[
    {{
        "start": "ISO datetime string",
        "end": "ISO datetime string"
    }}
]"""

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )

            response_text = response.text
            clean_response = response_text\
                .replace("```json", "")\
                .replace("```", "")\
                .strip()

            proposals = json.loads(clean_response)
            return proposals

        except Exception as e:
            print(f"Host refinement error: {str(e)}")
            return free_slots[:num_proposals]