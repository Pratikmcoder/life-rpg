from datetime import datetime, timezone
from bson import ObjectId
from app.database import characters_col
from app.utils.timezone import get_user_today
from app.services.rpg_engine import STREAK_DAILY_THRESHOLD


async def check_and_update_streak(character: dict, session=None) -> dict:
    """
    After adding runes, check if daily threshold is met and update streak.
    Returns dict with streak update info.
    """
    user_tz = character.get("timezone", "UTC")
    today_str = get_user_today(user_tz)

    daily_runes = character.get("daily_runes_today", 0)
    runes_date = character.get("runes_for_today_date", "")
    current_streak = character.get("streak", 0)
    streak_last_updated = character.get("streak_last_updated", "")

    streak_updated = False

    if daily_runes >= STREAK_DAILY_THRESHOLD and today_str != streak_last_updated:
        current_streak += 1
        streak_last_updated = today_str
        streak_updated = True

        await characters_col().update_one(
            {"_id": character["_id"]},
            {"$set": {
                "streak": current_streak,
                "streak_last_updated": today_str,
                "updated_at": datetime.now(timezone.utc),
            }},
            session=session,
        )

    return {
        "streak": current_streak,
        "streak_updated": streak_updated,
    }


async def reset_streak_if_expired(character: dict) -> bool:
    """
    Lazy check on login: if last streak update was > 1 calendar day ago,
    reset streak to 0. Returns True if streak was reset.
    """
    user_tz = character.get("timezone", "UTC")
    today_str = get_user_today(user_tz)
    streak_last_updated = character.get("streak_last_updated", "")

    if not streak_last_updated or streak_last_updated == today_str:
        return False

    # Calculate days between
    try:
        from datetime import date
        last = date.fromisoformat(streak_last_updated)
        today = date.fromisoformat(today_str)
        delta = (today - last).days
    except Exception:
        return False

    if delta > 1:
        await characters_col().update_one(
            {"_id": character["_id"]},
            {"$set": {
                "streak": 0,
                "updated_at": datetime.now(timezone.utc),
            }},
        )
        return True

    return False
