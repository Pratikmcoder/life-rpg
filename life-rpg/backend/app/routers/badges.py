from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.dependencies import get_current_user
from app.database import badges_col, user_badges_col

router = APIRouter(prefix="/api/badges", tags=["badges"])


@router.get("")
async def get_badges(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    all_badges = await badges_col().find({}).to_list(length=100)

    earned_cursor = user_badges_col().find({"user_id": user_id})
    earned_map = {}
    async for ub in earned_cursor:
        earned_map[str(ub["badge_id"])] = ub.get("earned_at")

    result = []
    for badge in all_badges:
        b_id_str = str(badge["_id"])
        is_earned = b_id_str in earned_map
        earned_at = earned_map.get(b_id_str)
        if earned_at and isinstance(earned_at, datetime):
            earned_at = earned_at.isoformat()

        result.append({
            "id": b_id_str,
            "badge_key": badge.get("badge_key"),
            "name": badge.get("name"),
            "description": badge.get("description"),
            "icon_key": badge.get("icon_key"),
            "is_earned": is_earned,
            "earned_at": earned_at,
        })

    return {"badges": result}
