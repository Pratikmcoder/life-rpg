from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional

from app.dependencies import get_current_user
from app.database import (
    quests_col, quest_logs_col, ledger_col, characters_col,
    items_col, user_badges_col
)
from app.models.quest import CreateQuestRequest, UpdateQuestRequest
from app.services.rpg_engine import (
    RUNE_REWARDS, ECHO_REWARDS, compute_level, compute_base_stats,
    STREAK_DAILY_THRESHOLD, MAX_LEVEL
)
from app.services.ledger_service import append_ledger
from app.services.streak_service import check_and_update_streak
from app.services.badge_service import evaluate_and_award_badges
from app.utils.timezone import get_user_today
from app.database import get_client

router = APIRouter(prefix="/api/quests", tags=["quests"])


def _ser_quest(q: dict) -> dict:
    return {
        "id": str(q["_id"]),
        "user_id": str(q["user_id"]),
        "title": q["title"],
        "description": q.get("description"),
        "difficulty": q["difficulty"],
        "rune_reward": q["rune_reward"],
        "echo_reward": q["echo_reward"],
        "is_completed": q.get("is_completed", False),
        "completed_at": q["completed_at"].isoformat() if q.get("completed_at") else None,
        "due_date": q.get("due_date"),
        "is_daily": q.get("is_daily", False),
        "created_at": q["created_at"].isoformat(),
    }


@router.get("")
async def list_quests(
    status: Optional[str] = Query(None, regex="^(active|completed|all)$"),
    current_user: dict = Depends(get_current_user),
):
    filt = {"user_id": current_user["_id"], "is_deleted": {"$ne": True}}
    if status == "active":
        filt["is_completed"] = False
    elif status == "completed":
        filt["is_completed"] = True

    cursor = quests_col().find(filt, sort=[("created_at", -1)])
    quests = [_ser_quest(q) async for q in cursor]
    return {"quests": quests}


@router.post("", status_code=201)
async def create_quest(
    body: CreateQuestRequest,
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": current_user["_id"],
        "title": body.title,
        "description": body.description,
        "difficulty": body.difficulty,
        "rune_reward": RUNE_REWARDS[body.difficulty],
        "echo_reward": ECHO_REWARDS[body.difficulty],
        "is_completed": False,
        "completed_at": None,
        "due_date": body.due_date,
        "is_daily": body.is_daily,
        "is_deleted": False,
        "created_at": now,
        "updated_at": now,
    }
    result = await quests_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _ser_quest(doc)


@router.patch("/{quest_id}")
async def update_quest(
    quest_id: str,
    body: UpdateQuestRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(quest_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid quest ID")

    quest = await quests_col().find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if quest.get("is_completed"):
        raise HTTPException(status_code=409, detail="Completed quests cannot be edited")

    updates = {"updated_at": datetime.now(timezone.utc)}
    if body.title is not None:
        updates["title"] = body.title.strip()[:100]
    if body.description is not None:
        updates["description"] = body.description.strip()[:500]
    if body.difficulty is not None:
        updates["difficulty"] = body.difficulty
        updates["rune_reward"] = RUNE_REWARDS[body.difficulty]
        updates["echo_reward"] = ECHO_REWARDS[body.difficulty]
    if body.due_date is not None:
        updates["due_date"] = body.due_date

    updated = await quests_col().find_one_and_update(
        {"_id": oid}, {"$set": updates}, return_document=True
    )
    return _ser_quest(updated)


@router.delete("/{quest_id}")
async def delete_quest(
    quest_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(quest_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid quest ID")

    quest = await quests_col().find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    await quests_col().update_one(
        {"_id": oid},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
    )
    return {"message": "Quest deleted"}


@router.post("/{quest_id}/complete")
async def complete_quest(
    quest_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(quest_id)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid quest ID")

    # Pre-transaction validation
    quest = await quests_col().find_one({"_id": oid, "is_deleted": {"$ne": True}})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if quest.get("is_completed"):
        raise HTTPException(status_code=409, detail="Quest already completed")

    char = await characters_col().find_one({"user_id": current_user["_id"]})
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    rune_reward = quest["rune_reward"]
    echo_reward = quest["echo_reward"]
    now = datetime.now(timezone.utc)

    # Determine today's date in user's timezone for streak tracking
    user_tz = char.get("timezone", "UTC")
    today_str = get_user_today(user_tz)

    # Reset daily runes if new calendar day
    existing_date = char.get("runes_for_today_date", "")
    if existing_date != today_str:
        daily_runes = rune_reward
    else:
        daily_runes = char.get("daily_runes_today", 0) + rune_reward

    # --- Begin Transaction ---
    client = get_client()
    async with await client.start_session() as session:
        async with session.start_transaction():
            # 1. Mark quest completed
            await quests_col().update_one(
                {"_id": oid},
                {"$set": {"is_completed": True, "completed_at": now, "updated_at": now}},
                session=session,
            )

            # 2. Insert quest log (immutable)
            await quest_logs_col().insert_one({
                "user_id": current_user["_id"],
                "quest_id": oid,
                "quest_title": quest["title"],
                "difficulty": quest["difficulty"],
                "runes_earned": rune_reward,
                "echoes_earned": echo_reward,
                "completed_at": now,
                "grace_level_at_time": char.get("grace_level", 1),
                "streak_at_time": char.get("streak", 0),
            }, session=session)

            # 3. Append ledger entries
            await append_ledger(
                user_id=current_user["_id"],
                event_type="quest_runes_earned",
                rune_delta=rune_reward,
                source_type="quest",
                source_id=oid,
                metadata={"quest_title": quest["title"], "difficulty": quest["difficulty"]},
                session=session,
            )
            await append_ledger(
                user_id=current_user["_id"],
                event_type="quest_echoes_earned",
                echo_delta=echo_reward,
                source_type="quest",
                source_id=oid,
                metadata={"quest_title": quest["title"]},
                session=session,
            )

            # 4. Update character: runes, echoes, daily tracking
            new_total_runes = char.get("total_runes", 0) + rune_reward
            new_echoes = char.get("echoes", 0) + echo_reward
            old_level = compute_level(char.get("total_runes", 0))
            new_level = compute_level(new_total_runes)
            leveled_up = new_level > old_level

            # Compute new base stats if leveled up
            char_update = {
                "total_runes": new_total_runes,
                "echoes": new_echoes,
                "daily_runes_today": daily_runes,
                "runes_for_today_date": today_str,
                "grace_level": new_level,
                "quest_completions_total": char.get("quest_completions_total", 0) + 1,
                "updated_at": now,
            }
            if leveled_up:
                new_stats = compute_base_stats(new_level)
                char_update.update(new_stats)
                # HP fully restores on level up
                char_update["current_hp"] = new_stats["base_vigor"]
                # Log each level-up event
                for lvl in range(old_level + 1, new_level + 1):
                    await append_ledger(
                        user_id=current_user["_id"],
                        event_type="level_up",
                        source_type="system",
                        metadata={"old_level": lvl - 1, "new_level": lvl},
                        session=session,
                    )

            await characters_col().update_one(
                {"user_id": current_user["_id"]},
                {"$set": char_update},
                session=session,
            )

            # 5. Streak check
            updated_char = {**char, **char_update}
            streak_result = await check_and_update_streak(updated_char, session=session)

    # --- Transaction committed ---

    # Badge evaluation (outside transaction, non-critical)
    final_char = await characters_col().find_one({"user_id": current_user["_id"]})
    new_badges = await evaluate_and_award_badges(
        user_id=current_user["_id"],
        character=final_char,
        trigger="quest_complete",
    )
    if leveled_up:
        await evaluate_and_award_badges(
            user_id=current_user["_id"],
            character=final_char,
            trigger="level_up",
        )

    return {
        "runes_earned": rune_reward,
        "echoes_earned": echo_reward,
        "new_total_runes": new_total_runes,
        "new_echoes": new_echoes,
        "old_level": old_level,
        "new_level": new_level,
        "leveled_up": leveled_up,
        "streak": streak_result["streak"],
        "streak_updated": streak_result["streak_updated"],
        "daily_runes_today": daily_runes,
        "new_badges": new_badges,
    }
