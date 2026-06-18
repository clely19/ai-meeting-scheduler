from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from api.users import router as users_router
from api.calendar import router as calendar_router
from api.agents import router as agents_router
from api.negotiation import router as negotiation_router
from database import get_db

app = FastAPI(title="Personal Scheduling Agent API")
DEMO_DIR = Path(__file__).resolve().parents[1] / "web_demo"

app.include_router(users_router)
app.include_router(calendar_router)
app.include_router(agents_router)
app.include_router(negotiation_router)

if DEMO_DIR.exists():
    app.mount("/demo", StaticFiles(directory=DEMO_DIR, html=True), name="demo")


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/demo/")


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
