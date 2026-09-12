from datetime import datetime, timezone
import random
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import Optional

from app.dependencies import get_current_user
from app.database import (
    bosses_col,
    characters_col,
    inventory_col,
    equipped_items_col,
    items_col,
    boss_fight_logs_col,
    ledger_col,
)
from app.services.boss_engine import simulate_boss_fight
from app.services.badge_service import evaluate_and_award_badges
from app.services.rpg_engine import compute_level, compute_level_details, compute_base_stats
from app.services.ledger_service import append_ledger
from app.routers.character import _compute_effective_stats

router = APIRouter(tags=["bosses"])


def _check_boss_unlocked(boss: dict, character: dict, all_bosses_by_key: dict) -> bool:
    req = boss.get("unlock_requirement", {})
    req_type = req.get("type")
    defeated = [str(b) for b in character.get("bosses_defeated", [])]

    if req_type == "grace_level":
        return character.get("grace_level", 1) >= req.get("value", 1)
    elif req_type == "boss_defeated":
        target_key = req.get("value")
        target_boss = all_bosses_by_key.get(target_key)
        if target_boss:
            return str(target_boss["_id"]) in defeated or target_key in defeated
        return False
    return True


@router.get("/api/map")
@router.get("/api/bosses")
async def get_boss_map(current_user: dict = Depends(get_current_user)):
    char = await characters_col().find_one({"user_id": current_user["_id"]})
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    bosses = await bosses_col().find({}).to_list(length=100)
    all_bosses_by_key = {b.get("boss_key"): b for b in bosses}
    defeated_ids = [str(b) for b in char.get("bosses_defeated", [])]

    result = []
    for boss in bosses:
        boss_id_str = str(boss["_id"])
        is_def = boss_id_str in defeated_ids or boss.get("boss_key") in defeated_ids
        is_unl = _check_boss_unlocked(boss, char, all_bosses_by_key)

        result.append({
            "id": boss_id_str,
            "boss_key": boss.get("boss_key"),
            "name": boss.get("name"),
            "lore": boss.get("lore"),
            "hp": boss.get("hp"),
            "ap": boss.get("ap"),
            "defense": boss.get("defense"),
            "map_position": boss.get("map_position"),
            "rewards": boss.get("rewards"),
            "pixel_art_key": boss.get("pixel_art_key"),
            "unlock_requirement": boss.get("unlock_requirement"),
            "is_unlocked": is_unl,
            "is_defeated": is_def,
        })

    return {"bosses": result}


@router.get("/api/bosses/{boss_id}")
async def get_boss_detail(boss_id: str, current_user: dict = Depends(get_current_user)):
    char = await characters_col().find_one({"user_id": current_user["_id"]})
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    query = {"_id": ObjectId(boss_id)} if ObjectId.is_valid(boss_id) else {"boss_key": boss_id}
    boss = await bosses_col().find_one(query)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")

    all_bosses = await bosses_col().find({}).to_list(length=100)
    all_bosses_by_key = {b.get("boss_key"): b for b in all_bosses}
    defeated_ids = [str(b) for b in char.get("bosses_defeated", [])]

    boss_id_str = str(boss["_id"])
    is_def = boss_id_str in defeated_ids or boss.get("boss_key") in defeated_ids
    is_unl = _check_boss_unlocked(boss, char, all_bosses_by_key)

    return {
        "id": boss_id_str,
        "boss_key": boss.get("boss_key"),
        "name": boss.get("name"),
        "lore": boss.get("lore"),
        "hp": boss.get("hp"),
        "ap": boss.get("ap"),
        "defense": boss.get("defense"),
        "map_position": boss.get("map_position"),
        "rewards": boss.get("rewards"),
        "pixel_art_key": boss.get("pixel_art_key"),
        "unlock_requirement": boss.get("unlock_requirement"),
        "is_unlocked": is_unl,
        "is_defeated": is_def,
    }


@router.post("/api/bosses/{boss_id}/fight")
async def fight_boss(boss_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    char = await characters_col().find_one({"user_id": user_id})
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    query = {"_id": ObjectId(boss_id)} if ObjectId.is_valid(boss_id) else {"boss_key": boss_id}
    boss = await bosses_col().find_one(query)
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")

    all_bosses = await bosses_col().find({}).to_list(length=100)
    all_bosses_by_key = {b.get("boss_key"): b for b in all_bosses}

    if not _check_boss_unlocked(boss, char, all_bosses_by_key):
        raise HTTPException(status_code=403, detail="Boss is locked")

    # Recompute live effective stats from equipped items
    stats = await _compute_effective_stats(user_id, char)
    player_vigor = stats.get("effective_vigor", 100)
    player_strength = stats.get("effective_strength", 10)
    player_poise = stats.get("effective_poise", 0)

    # Simulate combat deterministically at full HP
    fight_res = simulate_boss_fight(
        player_vigor=player_vigor,
        player_strength=player_strength,
        player_poise=player_poise,
        boss_hp=boss["hp"],
        boss_ap=boss["ap"],
        boss_defense=boss["defense"],
    )

    outcome = fight_res["outcome"]
    battle_log = fight_res["battle_log"]
    now = datetime.now(timezone.utc)

    runes_earned = 0
    echoes_earned = 0
    items_earned = []
    new_badges = []

    defeated_ids = [str(b) for b in char.get("bosses_defeated", [])]
    is_already_defeated = str(boss["_id"]) in defeated_ids or boss.get("boss_key") in defeated_ids
    first_time_victory = False

    if outcome == "victory":
        if is_already_defeated:
            first_time_victory = False
            runes_earned = 0
            echoes_earned = 0
            items_earned = []
            new_badges = []
        else:
            first_time_victory = True
            rewards = boss.get("rewards", {})
            echoes_earned = rewards.get("echoes", 0)
            runes_earned = rewards.get("runes", 0)

            # Check item drops
            for item_entry in rewards.get("items", []):
                item_key = item_entry.get("item_key")
                guaranteed = item_entry.get("guaranteed", False)
                drop_chance = item_entry.get("drop_chance", 1.0)

                should_drop = guaranteed or (random.random() <= drop_chance)
                if should_drop and item_key:
                    item_doc = await items_col().find_one({"item_key": item_key})
                    if item_doc:
                        await inventory_col().update_one(
                            {"user_id": user_id, "item_id": item_doc["_id"]},
                            {
                                "$inc": {"quantity": 1},
                                "$setOnInsert": {"acquired_at": now},
                            },
                            upsert=True,
                        )
                        items_earned.append({
                            "id": str(item_doc["_id"]),
                            "item_id": str(item_doc["_id"]),
                            "item_key": item_doc.get("item_key"),
                            "name": item_doc.get("name"),
                            "rarity": item_doc.get("rarity"),
                            "type": item_doc.get("type"),
                            "pixel_art_key": item_doc.get("pixel_art_key"),
                        })
                        await append_ledger(
                            user_id=user_id,
                            event_type="item_acquired_drop",
                            rune_delta=0,
                            echo_delta=0,
                            source_type="boss",
                            source_id=boss["_id"],
                            metadata={"item_key": item_key, "item_name": item_doc.get("name")},
                        )

            # Update character: bosses_defeated, runes, echoes, stats
            boss_id_ref = boss["_id"]
            new_total_runes = char.get("total_runes", 0) + runes_earned
            new_echoes = char.get("echoes", 0) + echoes_earned
            new_level_info = compute_level_details(new_total_runes)
            new_level = new_level_info["level"]

            await characters_col().update_one(
                {"user_id": user_id},
                {
                    "$addToSet": {"bosses_defeated": boss_id_ref},
                    "$set": {
                        "total_runes": new_total_runes,
                        "grace_level": new_level,
                        "echoes": new_echoes,
                        "current_hp": player_vigor,
                        "updated_at": now,
                    },
                },
            )

            if runes_earned > 0:
                await append_ledger(
                    user_id=user_id,
                    event_type="boss_runes_earned",
                    rune_delta=runes_earned,
                    echo_delta=0,
                    source_type="boss",
                    source_id=boss["_id"],
                    metadata={"boss_key": boss.get("boss_key"), "boss_name": boss.get("name")},
                )

            if echoes_earned > 0:
                await append_ledger(
                    user_id=user_id,
                    event_type="boss_echoes_earned",
                    rune_delta=0,
                    echo_delta=echoes_earned,
                    source_type="boss",
                    source_id=boss["_id"],
                    metadata={"boss_key": boss.get("boss_key"), "boss_name": boss.get("name")},
                )

            # Re-fetch updated character for badges
            updated_char = await characters_col().find_one({"user_id": user_id})
            new_badges = await evaluate_and_award_badges(
                user_id=user_id,
                character=updated_char,
                trigger="boss_fight",
                context={"boss_key": boss.get("boss_key")},
            )
    else:
        # On defeat: character always maintains full base HP (no reduced HP)
        await characters_col().update_one(
            {"user_id": user_id},
            {"$set": {"current_hp": player_vigor, "updated_at": now}},
        )

    # Check all equipment slots for consumable items (shields, helms, armor, rings, talismans)
    consumed_items = []
    for slot_name in ["weapon", "helmet", "armor", "accessory"]:
        eq_slot = await equipped_items_col().find_one({"user_id": user_id, "slot": slot_name})
        if eq_slot and eq_slot.get("item_id"):
            eq_item = await items_col().find_one({"_id": eq_slot["item_id"]})
            if eq_item and (eq_item.get("is_consumable") or "shield" in eq_item.get("item_key", "")):
                consumed_items.append(eq_item.get("name", slot_name.capitalize()))
                # Unequip and consume without restoring to pouch
                await equipped_items_col().update_one(
                    {"user_id": user_id, "slot": slot_name},
                    {"$set": {"item_id": None, "equipped_at": now}},
                )

    shield_consumed = len(consumed_items) > 0
    consumed_shield_name = ", ".join(consumed_items) if consumed_items else None

    # Save fight log
    await boss_fight_logs_col().insert_one({
        "user_id": user_id,
        "boss_id": boss["_id"],
        "outcome": outcome,
        "player_stats_snapshot": {
            "vigor": player_vigor,
            "strength": player_strength,
            "poise": player_poise,
        },
        "boss_stats_snapshot": {
            "hp": boss["hp"],
            "ap": boss["ap"],
            "defense": boss["defense"],
        },
        "battle_log": battle_log,
        "runes_earned": runes_earned,
        "echoes_earned": echoes_earned,
        "items_earned": [i["id"] for i in items_earned],
        "first_time_victory": first_time_victory,
        "shield_consumed": shield_consumed,
        "fought_at": now,
    })

    # Recompute live effective stats and persist updated stats to character
    refreshed_char = await characters_col().find_one({"user_id": user_id})
    refreshed_stats = await _compute_effective_stats(user_id, refreshed_char)
    await characters_col().update_one(
        {"user_id": user_id},
        {"$set": {
            "effective_vigor": refreshed_stats.get("effective_vigor", player_vigor),
            "effective_strength": refreshed_stats.get("effective_strength", player_strength),
            "effective_poise": refreshed_stats.get("effective_poise", player_poise),
            "current_hp": refreshed_stats.get("effective_vigor", player_vigor),
            "updated_at": now,
        }},
    )
    refreshed_char = await characters_col().find_one({"user_id": user_id})
    refreshed_level_info = compute_level_details(refreshed_char.get("total_runes", 0))

    return {
        "outcome": outcome,
        "battle_log": battle_log,
        "runes_earned": runes_earned,
        "echoes_earned": echoes_earned,
        "items_earned": items_earned,
        "newly_awarded_badges": new_badges,
        "first_time_victory": first_time_victory,
        "is_already_defeated": is_already_defeated,
        "shield_consumed": shield_consumed,
        "consumed_shield_name": consumed_shield_name,
        "player_stats": {
            "vigor": refreshed_stats.get("effective_vigor", player_vigor),
            "strength": refreshed_stats.get("effective_strength", player_strength),
            "poise": refreshed_stats.get("effective_poise", player_poise),
        },
        "boss_stats": {
            "hp": boss["hp"],
            "ap": boss["ap"],
            "defense": boss["defense"],
        },
        "character": {
            "grace_level": refreshed_level_info["level"],
            "total_runes": refreshed_char.get("total_runes"),
            "current_runes": refreshed_level_info["current_runes"],
            "next_level_runes": refreshed_level_info["needed_runes"],
            "progress_pct": refreshed_level_info["progress_pct"],
            "echoes": refreshed_char.get("echoes"),
            "current_hp": refreshed_stats.get("effective_vigor", player_vigor),
            "effective_vigor": refreshed_stats.get("effective_vigor", player_vigor),
            "effective_strength": refreshed_stats.get("effective_strength", player_strength),
            "effective_poise": refreshed_stats.get("effective_poise", player_poise),
        },
    }
