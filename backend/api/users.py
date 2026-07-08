from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter()
LOCAL_DEMO_USERS = {}


class UserRegistration(BaseModel):
    display_name: str
    scheduling_style: str = "balanced"


class UserResponse(BaseModel):
    id: str
    display_name: str
    scheduling_style: str
    created_at: str


@router.post("/users/register")
def register_user(user: UserRegistration):
    valid_styles = ["early", "balanced", "flexible"]
    if user.scheduling_style not in valid_styles:
        raise HTTPException(
            status_code=400,
            detail=f"scheduling_style must be one of {valid_styles}")

    try:
        db = get_db()
        response = db.table("users").insert({
            "display_name":
            user.display_name,
            "scheduling_style":
            user.scheduling_style
        }).execute()

        new_user = response.data[0]
        return {
            "id": new_user["id"],
            "display_name": new_user["display_name"],
            "scheduling_style": new_user["scheduling_style"],
            "created_at": new_user["created_at"]
        }
    except Exception as e:
        local_user = {
            "id": f"demo-{uuid4()}",
            "display_name": user.display_name,
            "scheduling_style": user.scheduling_style,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        LOCAL_DEMO_USERS[local_user["id"]] = local_user
        return {
            **local_user,
            "storage": "temporary_demo",
            "storage_warning": str(e)
        }


@router.get("/users/{user_id}")
def get_user(user_id: str):
    if user_id in LOCAL_DEMO_USERS:
        return LOCAL_DEMO_USERS[user_id]

    try:
        db = get_db()
        response = db.table("users")\
            .select("*")\
            .eq("id", user_id)\
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = response.data[0]
        return {
            "id": user["id"],
            "display_name": user["display_name"],
            "scheduling_style": user["scheduling_style"],
            "created_at": user["created_at"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
