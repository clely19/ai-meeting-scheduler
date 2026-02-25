import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. "
        "Check your Replit Secrets tab."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db() -> Client:
    return supabase