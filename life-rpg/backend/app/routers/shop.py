from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user
from app.database import (
    items_col, inventory_col, equipped_items_col, characters_col, ledger_col, get_client
)
from app.services.ledger_service import append_ledger
from app.services.badge_service import evaluate_and_award_badges

router = APIRouter(prefix="/api/shop", tags=["shop"])


def is_one_time_purchasable(item: dict) -> bool:
    return (
        item.get("type") == "weapon"
        or item.get("slot") == "weapon"
        or item.get("rarity") == "legendary"
    )


@router.get("")
async def list_shop_items(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    char = await characters_col().find_one({"user_id": user_id})
    bosses_defeated_ids = char.get("bosses_defeated", []) if char else []

    # Map boss ObjectId -> boss_key using bosses collection
    from app.database import bosses_col
    defeated_keys = set()
    async for boss in bosses_col().find({"_id": {"$in": bosses_defeated_ids}}):
        defeated_keys.add(boss["boss_key"])
    for b in bosses_defeated_ids:
        if isinstance(b, str):
            defeated_keys.add(b)

    # Gather purchased and currently owned items for one-time purchase check
    owned_or_bought_keys = set()
    async for entry in ledger_col().find({
        "user_id": user_id,
        "event_type": {"$in": ["shop_purchase", "item_purchased"]}
    }):
        k = entry.get("metadata", {}).get("item_key")
        if k:
            owned_or_bought_keys.add(k)
        if entry.get("source_id"):
            src_doc = await items_col().find_one({"_id": entry["source_id"]})
            if src_doc:
                owned_or_bought_keys.add(src_doc.get("item_key"))

    async for inv in inventory_col().find({"user_id": user_id, "quantity": {"$gt": 0}}):
        inv_doc = await items_col().find_one({"_id": inv["item_id"]})
        if inv_doc:
            owned_or_bought_keys.add(inv_doc["item_key"])
    async for eq in equipped_items_col().find({"user_id": user_id, "item_id": {"$ne": None}}):
        eq_doc = await items_col().find_one({"_id": eq["item_id"]})
        if eq_doc:
            owned_or_bought_keys.add(eq_doc["item_key"])

    items = []
    async for item in items_col().find({"is_purchasable": True}, sort=[("price_echoes", 1)]):
        unlock_key = item.get("unlock_boss_key")
        is_locked = bool(unlock_key) and unlock_key not in defeated_keys
        lock_reason = None
        if is_locked:
            from app.database import bosses_col as bc
            lock_boss = await bc().find_one({"boss_key": unlock_key})
            lock_reason = f"Defeat {lock_boss['name']} to unlock" if lock_boss else "Locked"

        one_time = is_one_time_purchasable(item)
        is_sold_out = one_time and (item["item_key"] in owned_or_bought_keys)

        items.append({
            "id": str(item["_id"]),
            "item_id": str(item["_id"]),
            "item_key": item["item_key"],
            "name": item["name"],
            "type": item["type"],
            "rarity": item["rarity"],
            "description": item["description"],
            "price_echoes": item["price_echoes"],
            "vigor_bonus": item.get("vigor_bonus", 0),
            "strength_bonus": item.get("strength_bonus", 0),
            "poise_bonus": item.get("poise_bonus", 0),
            "slot": item.get("slot"),
            "is_consumable": item.get("is_consumable", False),
            "is_stackable": item.get("is_stackable", False),
            "max_stack": item.get("max_stack", 1),
            "pixel_art_key": item.get("pixel_art_key", ""),
            "is_locked": is_locked,
            "lock_reason": lock_reason,
            "is_one_time": one_time,
            "is_sold_out": is_sold_out,
        })
    return {"items": items}


class PurchaseRequest(BaseModel):
    item_id: str
    quantity: int = 1


@router.post("/purchase")
async def purchase_item(
    body: PurchaseRequest,
    current_user: dict = Depends(get_current_user),
):
    # Support lookup by ObjectId or item_key
    if ObjectId.is_valid(body.item_id):
        item = await items_col().find_one({"_id": ObjectId(body.item_id)})
    else:
        item = await items_col().find_one({"item_key": body.item_id})

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if not item.get("is_purchasable"):
        raise HTTPException(status_code=403, detail="Item is not for sale")

    item_oid = item["_id"]
    user_id = current_user["_id"]

    if body.quantity < 1:
        raise HTTPException(status_code=422, detail="Quantity must be at least 1")

    # One-time purchasable check (weapons and legendary items)
    if is_one_time_purchasable(item):
        bought_before = await ledger_col().find_one({
            "user_id": user_id,
            "event_type": {"$in": ["shop_purchase", "item_purchased"]},
            "$or": [
                {"metadata.item_key": item["item_key"]},
                {"source_id": item_oid},
            ],
        })
        owns_in_inv = await inventory_col().find_one({
            "user_id": user_id,
            "item_id": item_oid,
            "quantity": {"$gt": 0},
        })
        owns_equipped = await equipped_items_col().find_one({
            "user_id": user_id,
            "item_id": item_oid,
        })
        if bought_before or owns_in_inv or owns_equipped:
            raise HTTPException(
                status_code=400,
                detail=f"{item['name']} is a unique relic and is already sold out.",
            )

    # Check boss unlock requirement
    unlock_key = item.get("unlock_boss_key")
    if unlock_key:
        char = await characters_col().find_one({"user_id": user_id})
        from app.database import bosses_col
        defeated_keys = set()
        async for boss in bosses_col().find({"_id": {"$in": char.get("bosses_defeated", [])}}):
            defeated_keys.add(boss["boss_key"])
        for b in char.get("bosses_defeated", []):
            if isinstance(b, str):
                defeated_keys.add(b)
        if unlock_key not in defeated_keys:
            raise HTTPException(status_code=403, detail="Item not yet unlocked")

    total_cost = item["price_echoes"] * body.quantity

    # Check stack limits
    if item.get("is_stackable"):
        existing_inv = await inventory_col().find_one(
            {"user_id": user_id, "item_id": item_oid}
        )
        current_qty = existing_inv["quantity"] if existing_inv else 0
        if current_qty + body.quantity > item.get("max_stack", 1):
            raise HTTPException(status_code=409, detail="Cannot carry more of this item")
        if current_qty + body.quantity > item.get("max_stack", 1):
            raise HTTPException(status_code=409, detail="Cannot carry more of this item")

    # --- Transaction ---
    client = get_client()
    async with await client.start_session() as session:
        async with session.start_transaction():
            char = await characters_col().find_one(
                {"user_id": current_user["_id"]}, session=session
            )
            if char["echoes"] < total_cost:
                raise HTTPException(status_code=402, detail="Insufficient Echoes")

            # Deduct echoes
            await characters_col().update_one(
                {"user_id": current_user["_id"]},
                {"$inc": {"echoes": -total_cost}, "$set": {"updated_at": datetime.now(timezone.utc)}},
                session=session,
            )

            # Add to inventory
            await inventory_col().update_one(
                {"user_id": current_user["_id"], "item_id": item_oid},
                {"$inc": {"quantity": body.quantity},
                 "$setOnInsert": {"acquired_at": datetime.now(timezone.utc)}},
                upsert=True,
                session=session,
            )

            # Ledger
            await append_ledger(
                user_id=current_user["_id"],
                event_type="item_purchased",
                echo_delta=-total_cost,
                source_type="shop",
                source_id=item_oid,
                metadata={"item_name": item["name"], "item_key": item["item_key"], "quantity": body.quantity, "price_each": item["price_echoes"]},
                session=session,
            )

    # Badge evaluation outside transaction
    final_char = await characters_col().find_one({"user_id": current_user["_id"]})
    await evaluate_and_award_badges(
        user_id=current_user["_id"],
        character=final_char,
        trigger="purchase",
        context={"trigger": "purchase"},
    )

    updated_char = await characters_col().find_one({"user_id": current_user["_id"]})
    inv_entry = await inventory_col().find_one({"user_id": current_user["_id"], "item_id": item_oid})

    return {
        "echoes_remaining": updated_char["echoes"],
        "item_purchased": item["name"],
        "quantity": body.quantity,
        "inventory_quantity": inv_entry["quantity"] if inv_entry else 0,
    }
