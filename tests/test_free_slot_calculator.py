import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from calendar_service.free_slot_calculator import get_free_slots


class FreeSlotCalculatorExtensiveTests(unittest.TestCase):
    def test_empty_calendar_returns_all_hourly_working_slots(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(len(slots), 9)
        self.assertEqual(slots[0]["start"], "2026-03-02T09:00:00")
        self.assertEqual(slots[-1]["start"], "2026-03-02T17:00:00")
        self.assertEqual(slots[-1]["end"], "2026-03-02T18:00:00")

    def test_custom_working_hours_limit_results(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
            working_hours_start=10,
            working_hours_end=13,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-02T10:00:00",
                "2026-03-02T11:00:00",
                "2026-03-02T12:00:00",
            ],
        )

    def test_working_hours_can_end_at_midnight(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-02T20:00:00",
            date_range_end="2026-03-03T01:00:00",
            duration_minutes=120,
            working_hours_start=20,
            working_hours_end=24,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-02T20:00:00",
                "2026-03-02T22:00:00",
            ],
        )

    def test_date_range_clamps_start_and_end_inside_working_day(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-02T10:30:00",
            date_range_end="2026-03-02T14:30:00",
            duration_minutes=60,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-02T10:30:00",
                "2026-03-02T11:30:00",
                "2026-03-02T12:30:00",
                "2026-03-02T13:30:00",
            ],
        )

    def test_slot_increment_can_be_shorter_than_duration(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-02T09:00:00",
            date_range_end="2026-03-02T11:00:00",
            duration_minutes=60,
            slot_increment_minutes=30,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-02T09:00:00",
                "2026-03-02T09:30:00",
                "2026-03-02T10:00:00",
            ],
        )

    def test_back_to_back_busy_blocks_do_not_create_false_gap(self):
        slots = get_free_slots(
            busy_blocks=[
                {
                    "start": "2026-03-02T09:00:00",
                    "end": "2026-03-02T10:00:00",
                },
                {
                    "start": "2026-03-02T10:00:00",
                    "end": "2026-03-02T11:00:00",
                },
            ],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(slots[0]["start"], "2026-03-02T11:00:00")

    def test_busy_block_covering_workday_returns_no_slots(self):
        slots = get_free_slots(
            busy_blocks=[
                {
                    "start": "2026-03-02T08:00:00",
                    "end": "2026-03-02T19:00:00",
                }
            ],
            date_range_start="2026-03-02T00:00:00",
            date_range_end="2026-03-02T23:59:59",
            duration_minutes=60,
        )

        self.assertEqual(slots, [])

    def test_multi_day_range_skips_weekend_and_resumes_monday(self):
        slots = get_free_slots(
            busy_blocks=[],
            date_range_start="2026-03-06T16:00:00",
            date_range_end="2026-03-09T11:00:00",
            duration_minutes=60,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-06T16:00:00",
                "2026-03-06T17:00:00",
                "2026-03-09T09:00:00",
                "2026-03-09T10:00:00",
            ],
        )

    def test_timezone_aware_inputs_are_supported_when_consistent(self):
        slots = get_free_slots(
            busy_blocks=[
                {
                    "start": "2026-03-02T10:00:00-06:00",
                    "end": "2026-03-02T11:00:00-06:00",
                }
            ],
            date_range_start="2026-03-02T09:00:00-06:00",
            date_range_end="2026-03-02T12:00:00-06:00",
            duration_minutes=60,
        )

        self.assertEqual(
            [slot["start"] for slot in slots],
            [
                "2026-03-02T09:00:00-06:00",
                "2026-03-02T11:00:00-06:00",
            ],
        )

    def test_mixed_timezone_awareness_is_rejected(self):
        with self.assertRaisesRegex(
            ValueError,
            "timezone awareness must match"
        ):
            get_free_slots(
                busy_blocks=[],
                date_range_start="2026-03-02T09:00:00-06:00",
                date_range_end="2026-03-02T12:00:00",
                duration_minutes=60,
            )

    def test_rejects_invalid_date_range_order(self):
        with self.assertRaisesRegex(
            ValueError,
            "date_range_end must be after date_range_start"
        ):
            get_free_slots(
                busy_blocks=[],
                date_range_start="2026-03-02T12:00:00",
                date_range_end="2026-03-02T09:00:00",
                duration_minutes=60,
            )

    def test_rejects_invalid_busy_block_order(self):
        with self.assertRaisesRegex(
            ValueError,
            "busy block end must be after busy block start"
        ):
            get_free_slots(
                busy_blocks=[
                    {
                        "start": "2026-03-02T11:00:00",
                        "end": "2026-03-02T10:00:00",
                    }
                ],
                date_range_start="2026-03-02T09:00:00",
                date_range_end="2026-03-02T12:00:00",
                duration_minutes=60,
            )

    def test_rejects_invalid_working_hours(self):
        with self.assertRaisesRegex(ValueError, "working hours"):
            get_free_slots(
                busy_blocks=[],
                date_range_start="2026-03-02T09:00:00",
                date_range_end="2026-03-02T12:00:00",
                duration_minutes=60,
                working_hours_start=18,
                working_hours_end=9,
            )

    def test_rejects_invalid_slot_increment(self):
        with self.assertRaisesRegex(
            ValueError,
            "slot_increment_minutes must be greater than 0"
        ):
            get_free_slots(
                busy_blocks=[],
                date_range_start="2026-03-02T09:00:00",
                date_range_end="2026-03-02T12:00:00",
                duration_minutes=60,
                slot_increment_minutes=0,
            )


if __name__ == "__main__":
    unittest.main()
