from datetime import datetime, timedelta
from typing import List, Dict
import random

def generate_mock_busy_blocks(
    user_id: str,
    date_range_start: str,
    date_range_end: str,
    density: str = "medium"
) -> List[Dict]:
    
    random.seed(hash(user_id) % 1000)
    
    density_map = {
        "light":  2,
        "medium": 4,
        "heavy":  6
    }
    meetings_per_day = density_map.get(density, 4)
    
    start_date = datetime.fromisoformat(date_range_start)
    end_date = datetime.fromisoformat(date_range_end)
    
    busy_blocks = []
    current_date = start_date
    
    meeting_titles = [
        "Team Standup",
        "1:1 Meeting",
        "Project Review",
        "Client Call",
        "Planning Session",
        "Design Review",
        "Sprint Planning"
    ]
    
    durations = [30, 45, 60, 90]
    
    while current_date <= end_date:
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
        
        used_slots = []
        
        for _ in range(meetings_per_day):
            hour = random.randint(9, 16)
            minute = random.choice([0, 30])
            duration = random.choice(durations)
            
            meeting_start = current_date.replace(
                hour=hour,
                minute=minute,
                second=0,
                microsecond=0
            )
            meeting_end = meeting_start + timedelta(
                minutes=duration
            )
            
            # Check no overlap with existing blocks
            overlap = False
            for used in used_slots:
                if (meeting_start < used["end"] and 
                        meeting_end > used["start"]):
                    overlap = True
                    break
            
            if not overlap and meeting_end.hour <= 18:
                block = {
                    "start": meeting_start.isoformat(),
                    "end": meeting_end.isoformat(),
                    "title": random.choice(meeting_titles)
                }
                busy_blocks.append(block)
                used_slots.append({
                    "start": meeting_start,
                    "end": meeting_end
                })
        
        current_date += timedelta(days=1)
    
    return busy_blocks
