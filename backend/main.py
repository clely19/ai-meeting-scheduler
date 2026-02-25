from fastapi import FastAPI
from database import get_db

app = FastAPI()

@app.get("/health")
def health():
    return {
        "status": "alive",
        "project": "ai-meeting-scheduler"
    }

@app.get("/db-test")
def test_database():
    try:
        db = get_db()

        response = db.table("users").select("*").limit(1).execute()

        return {
            "database": "connected",
            "users_table": "accessible",
            "result": response.data
        }
    except Exception as e:
        return {
            "database": "error",
            "detail": str(e)
        }