import asyncio
from app.database import (
    users_col,
    characters_col,
    quests_col,
    quest_logs_col,
    ledger_col,
    items_col,
    inventory_col,
    equipped_items_col,
    bosses_col,
    boss_fight_logs_col,
    badges_col,
    user_badges_col,
)
from app.seed.items import ITEMS
from app.seed.bosses import BOSSES
from app.seed.badges import BADGES


async def init_indexes():
    """Create all necessary MongoDB indexes idempotently."""
    try:
        # users
        await users_col().create_index("email", unique=True)
        await users_col().create_index("username", unique=True)

        # characters
        await characters_col().create_index("user_id", unique=True)

        # quests
        await quests_col().create_index([("user_id", 1), ("is_completed", 1)])
        await quests_col().create_index([("user_id", 1), ("created_at", -1)])

        # quest_logs
        await quest_logs_col().create_index([("user_id", 1), ("completed_at", -1)])

        # ledger
        await ledger_col().create_index([("user_id", 1), ("timestamp", -1)])

        # items
        await items_col().create_index("item_key", unique=True)

        # inventory
        await inventory_col().create_index([("user_id", 1), ("item_id", 1)], unique=True)

        # equipped_items
        await equipped_items_col().create_index([("user_id", 1), ("slot", 1)], unique=True)

        # bosses
        await bosses_col().create_index("boss_key", unique=True)

        # boss_fight_logs
        await boss_fight_logs_col().create_index([("user_id", 1), ("boss_id", 1)])
        await boss_fight_logs_col().create_index([("user_id", 1), ("fought_at", -1)])

        # badges
        await badges_col().create_index("badge_key", unique=True)

        # user_badges
        await user_badges_col().create_index([("user_id", 1), ("badge_id", 1)], unique=True)

        print("✅ Database indexes initialized successfully")
    except Exception as e:
        print(f"⚠️ Index initialization warning: {e}")


async def seed_static_catalogs():
    """Seed or update static catalogs (items, bosses, badges) and clean deprecated relics."""
    # Purge any deprecated healing flask relics from all collections
    flask_keys = ["healing_flask", "flask", "flask_of_tears", "health_potion"]
    flask_docs = await items_col().find({"item_key": {"$in": flask_keys}}).to_list(length=50)
    flask_ids = [d["_id"] for d in flask_docs]
    if flask_ids or flask_keys:
        await items_col().delete_many({"item_key": {"$in": flask_keys}})
        if flask_ids:
            await inventory_col().delete_many({"item_id": {"$in": flask_ids}})
            await equipped_items_col().delete_many({"item_id": {"$in": flask_ids}})

    # Seed Items
    for item in ITEMS:
        await items_col().update_one(
            {"item_key": item["item_key"]},
            {"$set": item},
            upsert=True,
        )

    # Seed Bosses
    for boss in BOSSES:
        await bosses_col().update_one(
            {"boss_key": boss["boss_key"]},
            {"$set": boss},
            upsert=True,
        )

    # Seed Badges
    for badge in BADGES:
        await badges_col().update_one(
            {"badge_key": badge["badge_key"]},
            {"$set": badge},
            upsert=True,
        )

    print(f"✅ Seeded {len(ITEMS)} items, {len(BOSSES)} bosses, {len(BADGES)} badges")
