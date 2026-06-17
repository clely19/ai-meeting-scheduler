import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from agents.personal_scheduling_agent import PersonalSchedulingAgent
from calendar_service.availability_store import (
    clear_availability,
    store_availability,
)
from calendar_service.free_slot_calculator import get_free_slots
from calendar_service.mock_generator import generate_mock_busy_blocks

try:
    from api.calendar import AvailabilityRequest, fetch_and_calculate_slots
except ModuleNotFoundError:
    AvailabilityRequest = None
    fetch_and_calculate_slots = None


class FreeSlotCalculatorTests(unittest.TestCase):
    def test_calculates_slots_around_busy_blocks(self):
        slots = get_free_slots(
            busy_blocks=[
                {
                    "start": "2026-03-02T10:00:00",
                    "end": "2026-03-02T11:00:00",
                },
                {
                    "start": "2026-03-02T13:00:00",
                    "end": "2026-03-02T14:00:00",
                },
            ],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-02T09:00:00",
                "2026-03-02T11:00:00",
                "2026-03-02T12:00:00",
                "2026-03-02T14:00:00",
                "2026-03-02T15:00:00",
                "2026-03-02T16:00:00",
                "2026-03-02T17:00:00",
            ],
        )

    def test_merges_overlapping_busy_blocks(self):
        slots = get_free_slots(
            busy_blocks=[
                {
                    "start": "2026-03-02T10:00:00",
                    "end": "2026-03-02T11:00:00",
                },
                {
                    "start": "2026-03-02T10:30:00",
                    "end": "2026-03-02T12:00:00",
                },
            ],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(slots[0]["start"], "2026-03-02T09:00:00")
        self.assertEqual(slots[1]["start"], "2026-03-02T12:00:00")

    def test_handles_busy_blocks_crossing_day_boundary(self):
        slots = get_free_slots(
            busy_blocks=[
                {
                    "start": "2026-03-01T17:00:00",
                    "end": "2026-03-02T10:00:00",
                }
            ],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(slots[0]["start"], "2026-03-02T10:00:00")

    def test_rejects_invalid_duration(self):
        with self.assertRaises(ValueError):
            get_free_slots(
                busy_blocks=[],
                date_range_start="2026-03-02T00:00:00",
                date_range_end="2026-03-02T23:59:59",
                duration_minutes=0,
            )

    def test_skips_weekends(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-07T00:00:00",
            date_range_end="2026-03-08T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(slots, [])


class MockGeneratorTests(unittest.TestCase):
    def test_mock_busy_blocks_are_stable_for_same_user(self):
        first = generate_mock_busy_blocks(
            "user-1",
            "2026-03-02T00:00:00",
            "2026-03-03T23:59:59",
        )
        second = generate_mock_busy_blocks(
            "user-1",
            "2026-03-02T00:00:00",
            "2026-03-03T23:59:59",
        )

        self.assertEqual(first, second)


@unittest.skipIf(
    AvailabilityRequest is None,
    "FastAPI dependency is not installed in this interpreter",
)
class CalendarApiTests(unittest.TestCase):
    def tearDown(self):
        clear_availability("api-user", "api-session")

    def test_empty_calendar_busy_blocks_are_not_mocked(self):
        response = fetch_and_calculate_slots(
            AvailabilityRequest(
                user_id="api-user",
                session_id="api-session",
                date_range_start="2026-03-02T00:00:00",
                date_range_end="2026-03-02T23:59:59",
                duration_minutes=60,
                busy_blocks=[],
            )
        )

        self.assertEqual(response["availability_source"], "calendar")
        self.assertEqual(response["slots_count"], 9)
        self.assertEqual(
            response["free_slots"][0]["start"],
            "2026-03-02T09:00:00",
        )

    def test_invalid_duration_returns_validation_error(self):
        with self.assertRaises(Exception) as context:
            fetch_and_calculate_slots(
                AvailabilityRequest(
                    user_id="api-user",
                    session_id="api-session",
                    date_range_start="2026-03-02T00:00:00",
                    date_range_end="2026-03-02T23:59:59",
                    duration_minutes=0,
                    busy_blocks=[],
                )
            )

        self.assertEqual(context.exception.status_code, 400)


class AgentFallbackTests(unittest.TestCase):
    def tearDown(self):
        clear_availability("invitee-1", "session-1")

    def test_agent_accepts_matching_slot_without_ai_client(self):
        store_availability(
            "invitee-1",
            "session-1",
            [
                {
                    "start": "2026-03-02T09:00:00",
                    "end": "2026-03-02T10:00:00",
                }
            ],
        )

        agent = PersonalSchedulingAgent(
            user_id="invitee-1",
            display_name="Invitee",
            scheduling_style="balanced",
        )
        decision = agent.evaluate_proposals(
            proposals=[
                {
                    "start": "2026-03-02T09:00:00",
                    "end": "2026-03-02T10:00:00",
                }
            ],
            session_id="session-1",
            meeting_duration=60,
            meeting_title="Planning",
        )

        self.assertEqual(decision["decision"], "ACCEPT")
        self.assertEqual(
            decision["accepted_slot"]["start"],
            "2026-03-02T09:00:00",
        )

    def test_agent_counters_when_proposal_does_not_fit(self):
        store_availability(
            "invitee-1",
            "session-1",
            [
                {
                    "start": "2026-03-02T11:00:00",
                    "end": "2026-03-02T12:00:00",
                }
            ],
        )

        agent = PersonalSchedulingAgent(
            user_id="invitee-1",
            display_name="Invitee",
            scheduling_style="early",
        )
        decision = agent.evaluate_proposals(
            proposals=[
                {
                    "start": "2026-03-02T09:00:00",
                    "end": "2026-03-02T10:00:00",
                }
            ],
            session_id="session-1",
            meeting_duration=60,
            meeting_title="Planning",
        )

        self.assertEqual(decision["decision"], "COUNTER")
        self.assertEqual(
            decision["counter_slots"][0]["start"],
            "2026-03-02T11:00:00",
        )


if __name__ == "__main__":
    unittest.main()
