import sys
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from agents.personal_scheduling_agent import PersonalSchedulingAgent
from calendar_service.availability_store import (
    clear_availability,
    store_availability,
)
from calendar_service.free_slot_calculator import get_free_slots
from calendar_service.mock_generator import generate_mock_busy_blocks
from negotiation.orchestrator import NegotiationOrchestrator

try:
    from api.calendar import AvailabilityRequest, fetch_and_calculate_slots
except ModuleNotFoundError:
    AvailabilityRequest = None
    fetch_and_calculate_slots = None

try:
    from api.demo_metrics import (
        LOCAL_LOVE_DEVICES,
        DemoLoveRequest,
        get_demo_love_count,
        register_demo_love,
    )
except ModuleNotFoundError:
    LOCAL_LOVE_DEVICES = None
    DemoLoveRequest = None
    get_demo_love_count = None
    register_demo_love = None


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


@unittest.skipIf(
    DemoLoveRequest is None,
    "FastAPI dependency is not installed in this interpreter",
)
class DemoMetricsTests(unittest.TestCase):
    def setUp(self):
        LOCAL_LOVE_DEVICES.clear()

    def tearDown(self):
        LOCAL_LOVE_DEVICES.clear()

    @patch("api.demo_metrics.get_db", side_effect=ValueError("no db"))
    def test_demo_love_counts_unique_devices_once(self, _get_db):
        first = register_demo_love(DemoLoveRequest(device_id="device-a"))
        duplicate = register_demo_love(DemoLoveRequest(device_id="device-a"))
        second = register_demo_love(DemoLoveRequest(device_id="device-b"))

        self.assertEqual(first["count"], 1)
        self.assertEqual(duplicate["count"], 1)
        self.assertEqual(second["count"], 2)

    @patch("api.demo_metrics.get_db", side_effect=ValueError("no db"))
    def test_demo_love_count_endpoint_uses_local_fallback(self, _get_db):
        register_demo_love(DemoLoveRequest(device_id="device-a"))

        response = get_demo_love_count()

        self.assertEqual(response["count"], 1)
        self.assertEqual(response["storage"], "temporary_demo")

    @patch("api.demo_metrics.get_db", side_effect=ValueError("no db"))
    def test_demo_love_count_lookup_does_not_count_new_device(self, _get_db):
        register_demo_love(DemoLoveRequest(device_id="device-a"))

        existing = get_demo_love_count(device_id="device-a")
        new_device = get_demo_love_count(device_id="device-b")

        self.assertEqual(existing["count"], 1)
        self.assertTrue(existing["loved"])
        self.assertEqual(new_device["count"], 1)
        self.assertFalse(new_device["loved"])

    @patch.dict("os.environ", {"DEMO_LOVE_REQUIRE_PERSISTENCE": "true"})
    @patch("api.demo_metrics.get_db", side_effect=ValueError("no db"))
    def test_demo_love_requires_persistence_when_configured(self, _get_db):
        with self.assertRaises(Exception) as context:
            get_demo_love_count()

        self.assertEqual(context.exception.status_code, 503)


class AgentFallbackTests(unittest.TestCase):
    def tearDown(self):
        clear_availability("invitee-1", "session-1")
        clear_availability("host", "session-next-common")
        clear_availability("maya", "session-next-common")
        clear_availability("jordan", "session-next-common")
        clear_availability("host", "session-no-common")
        clear_availability("maya", "session-no-common")
        clear_availability("jordan", "session-no-common")
        clear_availability("host", "session-consensus-guard")
        clear_availability("maya", "session-consensus-guard")
        clear_availability("jordan", "session-consensus-guard")

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

    def test_agent_does_not_use_server_ai_key_in_demo_mode(self):
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
            enable_ai=False,
        )

        with patch(
            "agents.personal_scheduling_agent._get_gemini_client"
        ) as get_client:
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

        get_client.assert_not_called()
        self.assertEqual(decision["decision"], "ACCEPT")

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

    def test_consensus_requires_slot_available_for_all_participants(self):
        session_id = "session-consensus-guard"
        proposal = {
            "start": "2026-03-02T09:00:00",
            "end": "2026-03-02T10:00:00",
        }

        store_availability("host", session_id, [proposal])
        store_availability("maya", session_id, [proposal])
        store_availability(
            "jordan",
            session_id,
            [
                {
                    "start": "2026-03-02T11:00:00",
                    "end": "2026-03-02T12:00:00",
                }
            ],
        )

        orchestrator = NegotiationOrchestrator(
            session_id=session_id,
            meeting_title="Planning",
            duration_minutes=60,
            date_range_start="2026-03-02T09:00:00",
            date_range_end="2026-03-02T18:00:00",
        )
        orchestrator.participant_user_ids = [
            "host",
            "maya",
            "jordan",
        ]

        consensus = orchestrator._check_consensus(
            proposals=[proposal],
            responses={
                "maya": {
                    "decision": "ACCEPT",
                    "accepted_slot": proposal,
                },
                "jordan": {
                    "decision": "ACCEPT",
                    "accepted_slot": proposal,
                },
            },
        )

        self.assertIsNone(consensus)

    def test_finds_next_common_available_slot_after_proposals_fail(self):
        session_id = "session-next-common"
        early_slot = {
            "start": "2026-06-30T09:00:00",
            "end": "2026-06-30T10:00:00",
        }
        shared_slot = {
            "start": "2026-07-01T11:00:00",
            "end": "2026-07-01T12:00:00",
        }

        store_availability(
            "host",
            session_id,
            [early_slot, shared_slot],
        )
        store_availability("maya", session_id, [shared_slot])
        store_availability("jordan", session_id, [shared_slot])

        orchestrator = NegotiationOrchestrator(
            session_id=session_id,
            meeting_title="Planning",
            duration_minutes=60,
            date_range_start="2026-06-30T09:00:00",
            date_range_end="2026-07-03T18:00:00",
        )
        orchestrator.participant_user_ids = [
            "host",
            "maya",
            "jordan",
        ]

        next_slot = orchestrator._find_next_common_available_slot()

        self.assertEqual(
            next_slot["start"],
            "2026-07-01T11:00:00",
        )

    def test_orchestrator_can_generate_late_night_slots(self):
        session_id = "session-late-night"
        orchestrator = NegotiationOrchestrator(
            session_id=session_id,
            meeting_title="Late planning",
            duration_minutes=60,
            date_range_start="2026-06-30T22:00:00",
            date_range_end="2026-06-30T23:00:00",
            participant_busy_blocks={
                "host": [],
                "maya": [],
                "jordan": [],
            },
            working_hours_start=22,
            working_hours_end=23,
        )

        host_slots = orchestrator._setup_agent_availability("host")
        maya_slots = orchestrator._setup_agent_availability("maya")
        jordan_slots = orchestrator._setup_agent_availability("jordan")

        self.assertEqual(host_slots[0]["start"], "2026-06-30T22:00:00")
        self.assertEqual(maya_slots[0]["start"], "2026-06-30T22:00:00")
        self.assertEqual(jordan_slots[0]["end"], "2026-06-30T23:00:00")

    def test_next_common_available_slot_returns_none_when_none_fit(self):
        session_id = "session-no-common"

        store_availability(
            "host",
            session_id,
            [
                {
                    "start": "2026-06-30T09:00:00",
                    "end": "2026-06-30T10:00:00",
                }
            ],
        )
        store_availability(
            "maya",
            session_id,
            [
                {
                    "start": "2026-07-01T11:00:00",
                    "end": "2026-07-01T12:00:00",
                }
            ],
        )
        store_availability(
            "jordan",
            session_id,
            [
                {
                    "start": "2026-07-02T13:00:00",
                    "end": "2026-07-02T14:00:00",
                }
            ],
        )

        orchestrator = NegotiationOrchestrator(
            session_id=session_id,
            meeting_title="Planning",
            duration_minutes=60,
            date_range_start="2026-06-30T09:00:00",
            date_range_end="2026-07-03T18:00:00",
        )
        orchestrator.participant_user_ids = [
            "host",
            "maya",
            "jordan",
        ]

        self.assertIsNone(
            orchestrator._find_next_common_available_slot()
        )


if __name__ == "__main__":
    unittest.main()
