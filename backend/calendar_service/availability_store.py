from typing import Dict, List

# In-memory store: {user_id: {session_id: [free_slots]}}
_availability_store: Dict[str, Dict[str, List]] = {}

def store_availability(
    user_id: str,
    session_id: str,
    free_slots: List[Dict]
) -> None:
    if user_id not in _availability_store:
        _availability_store[user_id] = {}
    _availability_store[user_id][session_id] = free_slots

def get_availability(
    user_id: str,
    session_id: str
) -> List[Dict]:
    return _availability_store\
        .get(user_id, {})\
        .get(session_id, [])

def clear_availability(
    user_id: str,
    session_id: str
) -> None:
    if user_id in _availability_store:
        if session_id in _availability_store[user_id]:
            del _availability_store[user_id][session_id]
