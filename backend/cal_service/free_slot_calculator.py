from datetime import datetime, timedelta
from typing import List, Dict

def get_free_slots(
    busy_blocks: List[Dict],
    date_range_start: str,
    date_range_end: str,
    duration_minutes: int,
    working_hours_start: int = 9,
    working_hours_end: int = 18
) -> List[Dict]:
    
    start_date = datetime.fromisoformat(date_range_start)
    end_date = datetime.fromisoformat(date_range_end)
    
    # Parse busy blocks into datetime objects
    parsed_busy = []
    for block in busy_blocks:
        parsed_busy.append({
            "start": datetime.fromisoformat(block["start"]),
            "end": datetime.fromisoformat(block["end"])
        })
    
    # Sort busy blocks by start time
    parsed_busy.sort(key=lambda x: x["start"])
    
    free_slots = []
    current_date = start_date
    
    while current_date <= end_date:
        # Define working hours for this day
        day_start = current_date.replace(
            hour=working_hours_start,
            minute=0,
            second=0,
            microsecond=0
        )
        day_end = current_date.replace(
            hour=working_hours_end,
            minute=0,
            second=0,
            microsecond=0
        )
        
        # Skip weekends
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
        
        # Find busy blocks for this day
        day_busy = [
            b for b in parsed_busy
            if b["start"].date() == current_date.date()
        ]
        
        # Find free slots between busy blocks
        slot_start = day_start
        
        for busy in day_busy:
            if slot_start + timedelta(minutes=duration_minutes) \
                    <= busy["start"]:
                free_slots.append({
                    "start": slot_start.isoformat(),
                    "end": (slot_start + timedelta(
                        minutes=duration_minutes
                    )).isoformat(),
                    "duration_minutes": duration_minutes
                })
            slot_start = max(slot_start, busy["end"])
        
        # Check for free slot after last busy block
        if slot_start + timedelta(minutes=duration_minutes) \
                <= day_end:
            free_slots.append({
                "start": slot_start.isoformat(),
                "end": (slot_start + timedelta(
                    minutes=duration_minutes
                )).isoformat(),
                "duration_minutes": duration_minutes
            })
        
        current_date += timedelta(days=1)
    
    return free_slots
