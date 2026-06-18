from datetime import datetime, timedelta
from typing import List, Dict


def _is_timezone_aware(value: datetime) -> bool:
    return value.tzinfo is not None and value.utcoffset() is not None


def _validate_timezone_consistency(
    value: datetime,
    field_name: str,
    expected_timezone_aware: bool
) -> None:
    if _is_timezone_aware(value) != expected_timezone_aware:
        raise ValueError(
            f"{field_name} timezone awareness must match "
            "date_range_start"
        )


def _parse_iso_datetime(value: str, field_name: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            f"{field_name} must be a valid ISO datetime string"
        ) from exc


def _merge_busy_blocks(
    busy_blocks: List[Dict],
    expected_timezone_aware: bool
) -> List[Dict]:
    parsed_busy = []
    for block in busy_blocks:
        block_start = _parse_iso_datetime(
            block.get("start"),
            "busy_blocks[].start"
        )
        block_end = _parse_iso_datetime(
            block.get("end"),
            "busy_blocks[].end"
        )

        _validate_timezone_consistency(
            block_start,
            "busy_blocks[].start",
            expected_timezone_aware
        )
        _validate_timezone_consistency(
            block_end,
            "busy_blocks[].end",
            expected_timezone_aware
        )

        if block_end <= block_start:
            raise ValueError(
                "busy block end must be after busy block start"
            )

        parsed_busy.append({
            "start": block_start,
            "end": block_end
        })

    parsed_busy.sort(key=lambda block: block["start"])

    merged_busy = []
    for block in parsed_busy:
        if not merged_busy or block["start"] > merged_busy[-1]["end"]:
            merged_busy.append(block)
            continue

        merged_busy[-1]["end"] = max(
            merged_busy[-1]["end"],
            block["end"]
        )

    return merged_busy


def _build_day_boundary(
    current_date: datetime,
    hour: int
) -> datetime:
    day_boundary = current_date.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    if hour == 24:
        return day_boundary + timedelta(days=1)

    return day_boundary.replace(hour=hour)


def get_free_slots(
    busy_blocks: List[Dict],
    date_range_start: str,
    date_range_end: str,
    duration_minutes: int,
    working_hours_start: int = 9,
    working_hours_end: int = 18,
    slot_increment_minutes: int | None = None
) -> List[Dict]:

    if duration_minutes <= 0:
        raise ValueError("duration_minutes must be greater than 0")

    if not 0 <= working_hours_start < working_hours_end <= 24:
        raise ValueError(
            "working hours must satisfy "
            "0 <= start < end <= 24"
        )

    if slot_increment_minutes is None:
        slot_increment_minutes = duration_minutes

    if slot_increment_minutes <= 0:
        raise ValueError(
            "slot_increment_minutes must be greater than 0"
        )

    start_date = _parse_iso_datetime(
        date_range_start,
        "date_range_start"
    )
    end_date = _parse_iso_datetime(
        date_range_end,
        "date_range_end"
    )

    expected_timezone_aware = _is_timezone_aware(start_date)
    _validate_timezone_consistency(
        end_date,
        "date_range_end",
        expected_timezone_aware
    )

    if end_date <= start_date:
        raise ValueError(
            "date_range_end must be after date_range_start"
        )

    parsed_busy = _merge_busy_blocks(
        busy_blocks,
        expected_timezone_aware
    )
    
    free_slots = []
    current_date = start_date.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )
    
    while current_date <= end_date:
        day_start = _build_day_boundary(
            current_date,
            working_hours_start
        )
        day_end = _build_day_boundary(
            current_date,
            working_hours_end
        )

        window_start = max(day_start, start_date)
        window_end = min(day_end, end_date)
        
        if current_date.weekday() >= 5 or window_start >= window_end:
            current_date += timedelta(days=1)
            continue
        
        day_busy = [
            b for b in parsed_busy
            if b["start"] < window_end and b["end"] > window_start
        ]
        
        gap_start = window_start
        
        for busy in day_busy:
            gap_end = min(busy["start"], window_end)
            free_slots.extend(
                _build_slots_for_gap(
                    gap_start,
                    gap_end,
                    duration_minutes,
                    slot_increment_minutes
                )
            )
            gap_start = max(gap_start, busy["end"])
        
        free_slots.extend(
            _build_slots_for_gap(
                gap_start,
                window_end,
                duration_minutes,
                slot_increment_minutes
            )
        )
        
        current_date += timedelta(days=1)
    
    return free_slots


def _build_slots_for_gap(
    gap_start: datetime,
    gap_end: datetime,
    duration_minutes: int,
    slot_increment_minutes: int
) -> List[Dict]:
    slots = []
    duration = timedelta(minutes=duration_minutes)
    increment = timedelta(minutes=slot_increment_minutes)
    slot_start = gap_start

    while slot_start + duration <= gap_end:
        slot_end = slot_start + duration
        slots.append({
            "start": slot_start.isoformat(),
            "end": slot_end.isoformat(),
            "duration_minutes": duration_minutes
        })
        slot_start += increment

    return slots
