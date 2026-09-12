from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.database import characters_col, equipped_items_col, items_col, ledger_col
from app.services.rpg_engine import (
    compute_level, compute_level_details, compute_base_stats, MAX_LEVEL
)

router = APIRouter(prefix="/api/character", tags=["character"])


def _str_id(obj_id) -> str:
    return str(obj_id)


async def _compute_effective_stats(user_id: ObjectId, char: dict = None) -> dict:
    """Sum base stats + all equipped item bonuses."""
    if not char:
        char = await characters_col().find_one({"user_id": user_id})
    if not char:
        return {}

    total_runes = char.get("total_runes", 0)
    level = compute_level(total_runes)
    base = compute_base_stats(level)
    vigor = base["base_vigor"]
    strength = base["base_strength"]
    poise = base["base_poise"]

    slots = ["weapon", "helmet", "armor", "accessory"]
    for slot in slots:
        eq = await equipped_items_col().find_one({"user_id": user_id, "slot": slot})
        if eq and eq.get("item_id"):
            item = await items_col().find_one({"_id": eq["item_id"]})
            if item:
                vigor += item.get("vigor_bonus", 0)
                strength += item.get("strength_bonus", 0)
                poise += item.get("poise_bonus", 0)

    return {
        "base_vigor": base["base_vigor"],
        "base_strength": base["base_strength"],
        "base_poise": base["base_poise"],
        "effective_vigor": vigor,
        "effective_strength": strength,
        "effective_poise": poise,
    }


async def _serialize_character(char: dict) -> dict:
    """Convert a character document to API response format."""
    user_id = char["user_id"]
    stats = await _compute_effective_stats(user_id, char)

    # Equipped items
    equipped = {}
    for slot in ["weapon", "helmet", "armor", "accessory"]:
        eq = await equipped_items_col().find_one({"user_id": user_id, "slot": slot})
        if eq and eq.get("item_id"):
            item = await items_col().find_one({"_id": eq["item_id"]})
            if item:
                equipped[slot] = {
                    "id": _str_id(item["_id"]),
                    "item_id": _str_id(item["_id"]),
                    "name": item["name"],
                    "item_key": item["item_key"],
                    "type": item["type"],
                    "rarity": item["rarity"],
                    "vigor_bonus": item.get("vigor_bonus", 0),
                    "strength_bonus": item.get("strength_bonus", 0),
                    "poise_bonus": item.get("poise_bonus", 0),
                    "pixel_art_key": item.get("pixel_art_key", ""),
                }
            else:
                equipped[slot] = None
        else:
            equipped[slot] = None

    total_runes = char.get("total_runes", 0)
    level_info = compute_level_details(total_runes)
    eff_vigor = stats.get("effective_vigor", 100)

    return {
        "id": _str_id(char["_id"]),
        "user_id": _str_id(user_id),
        "name": char.get("name", "Tarnished"),
        "grace_level": level_info["level"],
        "level": level_info["level"],
        "total_runes": total_runes,
        "current_runes": level_info["current_runes"],
        "runes_in_level": level_info["current_runes"],
        "needed_runes": level_info["needed_runes"],
        "next_level_runes": level_info["needed_runes"],
        "runes_to_next_level": level_info["needed_runes"],
        "progress_pct": level_info["progress_pct"],
        "is_max_level": level_info["is_max_level"],
        "echoes": char.get("echoes", 0),
        "base_vigor": stats.get("base_vigor", 100),
        "base_strength": stats.get("base_strength", 10),
        "base_poise": stats.get("base_poise", 0),
        "effective_vigor": eff_vigor,
        "effective_strength": stats.get("effective_strength", 10),
        "effective_poise": stats.get("effective_poise", 0),
        "current_hp": eff_vigor,  # Character HP is always full base/effective HP
        "streak": char.get("streak", 0),
        "streak_last_updated": char.get("streak_last_updated", ""),
        "daily_runes_today": char.get("daily_runes_today", 0),
        "bosses_defeated": [_str_id(b) for b in char.get("bosses_defeated", [])],
        "onboarding_complete": char.get("onboarding_complete", False),
        "quest_completions_total": char.get("quest_completions_total", 0),
        "equipped": equipped,
        "timezone": char.get("timezone", "UTC"),
        "created_at": char.get("created_at", "").isoformat() if char.get("created_at") else "",
    }


@router.get("")
async def get_character(current_user: dict = Depends(get_current_user)):
    char = await characters_col().find_one({"user_id": current_user["_id"]})
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    return await _serialize_character(char)


class UpdateCharacterRequest(BaseModel):
    name: Optional[str] = None
    timezone: Optional[str] = None


@router.patch("")
async def update_character(
    body: UpdateCharacterRequest,
    current_user: dict = Depends(get_current_user),
):
    updates = {}
    if body.name is not None:
        name = body.name.strip()
        if len(name) < 2 or len(name) > 24:
            raise HTTPException(status_code=422, detail="Name must be 2–24 characters")
        updates["name"] = name
        updates["onboarding_complete"] = True
    if body.timezone is not None:
        import pytz
        try:
            pytz.timezone(body.timezone)
            updates["timezone"] = body.timezone
        except Exception:
            raise HTTPException(status_code=422, detail="Invalid timezone")

    if not updates:
        raise HTTPException(status_code=422, detail="No valid fields to update")

    updates["updated_at"] = datetime.now(timezone.utc)
    result = await characters_col().find_one_and_update(
        {"user_id": current_user["_id"]},
        {"$set": updates},
        return_document=True,
    )
    return await _serialize_character(result)


@router.get("/activity")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    """Return last 20 ledger events for activity feed."""
    cursor = ledger_col().find(
        {"user_id": current_user["_id"]},
        sort=[("timestamp", -1)],
        limit=20,
    )
    events = []
    async for doc in cursor:
        events.append({
            "id": _str_id(doc["_id"]),
            "event_type": doc["event_type"],
            "rune_delta": doc.get("rune_delta", 0),
            "echo_delta": doc.get("echo_delta", 0),
            "source_type": doc.get("source_type", ""),
            "metadata": doc.get("metadata", {}),
            "timestamp": doc["timestamp"].isoformat(),
        })
    return {"events": events}
