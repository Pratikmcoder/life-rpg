from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.database import (
    inventory_col, equipped_items_col, items_col, characters_col
)
from app.services.rpg_engine import compute_base_stats, compute_level

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

VALID_SLOTS = ["weapon", "helmet", "armor", "accessory"]


async def _recompute_effective_stats(user_id: ObjectId, session=None):
    """Recalculate character effective stats from base + all equipped items and save."""
    char = await characters_col().find_one({"user_id": user_id})
    if not char:
        return {}

    total_runes = char.get("total_runes", 0)
    level = compute_level(total_runes)
    base = compute_base_stats(level)
    vigor = base["base_vigor"]
    strength = base["base_strength"]
    poise = base["base_poise"]

    for slot in VALID_SLOTS:
        eq = await equipped_items_col().find_one({"user_id": user_id, "slot": slot})
        if eq and eq.get("item_id"):
            item = await items_col().find_one({"_id": eq["item_id"]})
            if item:
                vigor += item.get("vigor_bonus", 0)
                strength += item.get("strength_bonus", 0)
                poise += item.get("poise_bonus", 0)

    await characters_col().update_one(
        {"user_id": user_id},
        {"$set": {
            "effective_vigor": vigor,
            "effective_strength": strength,
            "effective_poise": poise,
            "current_hp": vigor,
            "updated_at": datetime.now(timezone.utc),
        }},
        session=session,
    )
    return {
        "base_vigor": base["base_vigor"],
        "base_strength": base["base_strength"],
        "base_poise": base["base_poise"],
        "effective_vigor": vigor,
        "effective_strength": strength,
        "effective_poise": poise,
    }


@router.get("")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]

    # Fetch inventory
    inv_items = []
    async for inv in inventory_col().find({"user_id": user_id, "quantity": {"$gt": 0}}):
        item = await items_col().find_one({"_id": inv["item_id"]})
        if item and not item.get("item_key", "").startswith("healing_flask") and not item.get("item_key", "").startswith("flask"):
            inv_items.append({
                "id": str(item["_id"]),
                "inventory_id": str(inv["_id"]),
                "item_id": str(item["_id"]),
                "item_key": item["item_key"],
                "name": item["name"],
                "type": item["type"],
                "rarity": item["rarity"],
                "description": item["description"],
                "slot": item.get("slot"),
                "vigor_bonus": item.get("vigor_bonus", 0),
                "strength_bonus": item.get("strength_bonus", 0),
                "poise_bonus": item.get("poise_bonus", 0),
                "is_stackable": item.get("is_stackable", False),
                "is_consumable": item.get("is_consumable", False),
                "quantity": inv["quantity"],
                "pixel_art_key": item.get("pixel_art_key", ""),
            })

    # Fetch equipped
    equipped = {}
    for slot in VALID_SLOTS:
        eq = await equipped_items_col().find_one({"user_id": user_id, "slot": slot})
        if eq and eq.get("item_id"):
            item = await items_col().find_one({"_id": eq["item_id"]})
            equipped[slot] = {
                "id": str(item["_id"]),
                "item_id": str(item["_id"]),
                "item_key": item["item_key"],
                "name": item["name"],
                "type": item["type"],
                "rarity": item["rarity"],
                "vigor_bonus": item.get("vigor_bonus", 0),
                "strength_bonus": item.get("strength_bonus", 0),
                "poise_bonus": item.get("poise_bonus", 0),
                "is_consumable": item.get("is_consumable", False),
                "pixel_art_key": item.get("pixel_art_key", ""),
            } if item else None
        else:
            equipped[slot] = None

    return {"items": inv_items, "equipped": equipped}


class EquipRequest(BaseModel):
    item_id: str
    slot: str


@router.post("/equip")
async def equip_item(
    body: EquipRequest,
    current_user: dict = Depends(get_current_user),
):
    if body.slot not in VALID_SLOTS:
        raise HTTPException(status_code=422, detail=f"Invalid slot. Must be one of {VALID_SLOTS}")

    user_id = current_user["_id"]

    # Support finding item by ObjectId or item_key
    if ObjectId.is_valid(body.item_id):
        item = await items_col().find_one({"_id": ObjectId(body.item_id)})
    else:
        item = await items_col().find_one({"item_key": body.item_id})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item_oid = item["_id"]

    # Verify item is in user's pouch inventory with available quantity
    inv = await inventory_col().find_one({"user_id": user_id, "item_id": item_oid, "quantity": {"$gt": 0}})
    if not inv:
        raise HTTPException(status_code=404, detail="Item not available in your pouch")

    item_slot = item.get("slot") or item.get("type")
    if item_slot != body.slot:
        raise HTTPException(status_code=422, detail=f"This item goes in the '{item_slot}' slot, not '{body.slot}'")

    now = datetime.now(timezone.utc)

    # 1. If an item is already equipped in this slot, return it to pouch inventory
    existing_eq = await equipped_items_col().find_one({"user_id": user_id, "slot": body.slot})
    if existing_eq and existing_eq.get("item_id"):
        old_item_id = existing_eq["item_id"]
        await inventory_col().update_one(
            {"user_id": user_id, "item_id": old_item_id},
            {"$inc": {"quantity": 1}, "$setOnInsert": {"acquired_at": now}},
            upsert=True,
        )

    # 2. Decrement newly equipped item from pouch inventory
    updated_inv = await inventory_col().find_one_and_update(
        {"user_id": user_id, "item_id": item_oid, "quantity": {"$gt": 0}},
        {"$inc": {"quantity": -1}},
        return_document=True,
    )
    if updated_inv and updated_inv.get("quantity", 0) <= 0:
        await inventory_col().delete_one({"_id": updated_inv["_id"]})

    # 3. Upsert equipped_items slot
    await equipped_items_col().update_one(
        {"user_id": user_id, "slot": body.slot},
        {"$set": {"item_id": item_oid, "equipped_at": now}},
        upsert=True,
    )

    # Recompute effective stats
    new_stats = await _recompute_effective_stats(user_id)
    return {"message": f"{item['name']} equipped", "slot": body.slot, "new_effective_stats": new_stats}


class UnequipRequest(BaseModel):
    slot: str


@router.post("/unequip")
async def unequip_item(
    body: UnequipRequest,
    current_user: dict = Depends(get_current_user),
):
    if body.slot not in VALID_SLOTS:
        raise HTTPException(status_code=422, detail="Invalid slot")

    user_id = current_user["_id"]
    existing_eq = await equipped_items_col().find_one({"user_id": user_id, "slot": body.slot})

    if existing_eq and existing_eq.get("item_id"):
        unequipped_item_id = existing_eq["item_id"]
        now = datetime.now(timezone.utc)
        # Return item to pouch inventory
        await inventory_col().update_one(
            {"user_id": user_id, "item_id": unequipped_item_id},
            {"$inc": {"quantity": 1}, "$setOnInsert": {"acquired_at": now}},
            upsert=True,
        )
        # Clear slot
        await equipped_items_col().update_one(
            {"user_id": user_id, "slot": body.slot},
            {"$set": {"item_id": None, "equipped_at": now}},
            upsert=True,
        )

    new_stats = await _recompute_effective_stats(user_id)
    return {"message": "Item unequipped", "slot": body.slot, "new_effective_stats": new_stats}
