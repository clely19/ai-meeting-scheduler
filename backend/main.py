from fastapi import FastAPI
from database import get_db
from api.users import router as users_router
from api.calendar import router as calendar_router

app = FastAPI(title="Personal Scheduling Agent API")

app.include_router(users_router)
app.include_router(calendar_router)


@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "alive", "project": "ai-meeting-scheduler"}


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
        return {"database": "error", "detail": str(e)}
