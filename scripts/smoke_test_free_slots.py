import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from calendar_service.free_slot_calculator import get_free_slots


def main() -> None:
    slots = get_free_slots(
        busy_blocks=[
            {
                "start": "2026-03-02T10:00:00",
                "end": "2026-03-02T11:30:00",
            },
            {
                "start": "2026-03-02T13:00:00",
                "end": "2026-03-02T14:00:00",
            },
        ],
        date_range_start="2026-03-02T09:00:00",
        date_range_end="2026-03-02T18:00:00",
        duration_minutes=60,
        slot_increment_minutes=30,
    )

    print(json.dumps(slots, indent=2))


if __name__ == "__main__":
    main()
