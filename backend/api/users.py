from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter()

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
    # Validate scheduling style
    valid_styles = ["early", "balanced", "flexible"]
    if user.scheduling_style not in valid_styles:
        raise HTTPException(
            status_code=400,
            detail=f"scheduling_style must be one of {valid_styles}"
        )
    
    try:
        db = get_db()
        response = db.table("users").insert({
            "display_name": user.display_name,
            "scheduling_style": user.scheduling_style
        }).execute()
        
        new_user = response.data[0]
        return {
            "id": new_user["id"],
            "display_name": new_user["display_name"],
            "scheduling_style": new_user["scheduling_style"],
            "created_at": new_user["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
def get_user(user_id: str):
    try:
        db = get_db()
        response = db.table("users")\
            .select("*")\
            .eq("id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=404, 
                detail="User not found"
            )
        
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
