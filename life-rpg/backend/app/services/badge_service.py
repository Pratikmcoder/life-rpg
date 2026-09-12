"""
Badge evaluation service.
Called after quest completion, level-up, boss fight, and shop purchase.
Evaluates badge conditions and awards newly earned badges.
"""
from datetime import datetime, timezone
from bson import ObjectId
from app.database import badges_col, user_badges_col, quest_logs_col


async def evaluate_and_award_badges(
    user_id: ObjectId,
    character: dict,
    trigger: str,  # "quest_complete" | "level_up" | "boss_fight" | "purchase"
    context: dict = None,
) -> list[str]:
    """
    Evaluate all badge conditions for a user.
    Awards any newly earned badges.
    Returns list of newly awarded badge_keys.
    """
    context = context or {}

    # Fetch all badges and already-earned badge IDs for this user
    all_badges = await badges_col().find({}).to_list(length=100)
    earned_cursor = user_badges_col().find({"user_id": user_id}, {"badge_id": 1})
    earned_ids = {doc["badge_id"] async for doc in earned_cursor}

    newly_earned = []

    for badge in all_badges:
        if badge["_id"] in earned_ids:
            continue  # Already earned

        condition = badge.get("condition", {})
        cond_type = condition.get("type")
        earned = False

        if cond_type == "first_quest":
            earned = character.get("quest_completions_total", 0) >= 1

        elif cond_type == "grace_level":
            earned = character.get("grace_level", 1) >= condition.get("level", 1)

        elif cond_type == "streak":
            earned = character.get("streak", 0) >= condition.get("days", 1)

        elif cond_type == "quest_total":
            total = await quest_logs_col().count_documents({"user_id": user_id})
            earned = total >= condition.get("count", 1)

        elif cond_type == "first_purchase":
            earned = context.get("trigger") == "purchase" or condition.get("check_ledger")

        elif cond_type == "first_boss":
            earned = len(character.get("bosses_defeated", [])) >= 1

        elif cond_type == "all_bosses":
            from app.database import bosses_col
            total_bosses = await bosses_col().count_documents({})
            earned = len(character.get("bosses_defeated", [])) >= total_bosses

        if earned:
            try:
                await user_badges_col().insert_one({
                    "user_id": user_id,
                    "badge_id": badge["_id"],
                    "earned_at": datetime.now(timezone.utc),
                })
                newly_earned.append(badge["badge_key"])
            except Exception:
                pass  # Already exists (race condition safe)

    return newly_earned
