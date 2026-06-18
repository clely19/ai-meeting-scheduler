import os
from typing import Any

supabase: Any | None = None


def get_db() -> Any:
    global supabase

    if supabase:
        return supabase

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError(
            "Missing Supabase credentials. Set SUPABASE_URL "
            "and SUPABASE_KEY in the hosting environment."
        )

    from supabase import create_client

    supabase = create_client(supabase_url, supabase_key)
    return supabase
