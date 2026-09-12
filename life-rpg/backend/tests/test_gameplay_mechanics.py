import pytest
from app.services.boss_engine import simulate_boss_fight
from app.services.rpg_engine import compute_level_details, compute_base_stats


def test_boss_simulation_outcome():
    # Strong hero vs weak boss
    res = simulate_boss_fight(
        player_vigor=300,
        player_strength=50,
        player_poise=15,
        boss_hp=100,
        boss_ap=20,
        boss_defense=5,
    )
    assert res["outcome"] == "victory"
    assert res["player_hp_remaining"] > 0
    assert len(res["battle_log"]) > 0


def test_level_details_runes_progression():
    # Zero runes is level 1
    lvl1 = compute_level_details(0)
    assert lvl1["level"] == 1
    assert lvl1["progress_pct"] == 0

    # 100 runes triggers level 2
    lvl2 = compute_level_details(100)
    assert lvl2["level"] == 2


def test_base_stats_scaling():
    stats1 = compute_base_stats(1)
    stats2 = compute_base_stats(2)
    assert stats2["base_vigor"] > stats1["base_vigor"]
    assert stats2["base_strength"] > stats1["base_strength"]


def test_consumable_items_catalog():
    from app.seed.items import ITEMS
    items_by_key = {i["item_key"]: i for i in ITEMS}

    expected_consumables = [
        "worn_shield",
        "knights_helm",
        "chain_mail",
        "plate_armor",
        "dragon_helm",
        "soldiers_ring",
        "blessed_seal",
        "rune_talisman",
    ]

    for k in expected_consumables:
        assert k in items_by_key, f"Missing item {k}"
        assert items_by_key[k].get("is_consumable") is True, f"Item {k} is not marked as consumable"


def test_one_time_purchasable_logic():
    from app.routers.shop import is_one_time_purchasable

    # Weapons should be one-time
    assert is_one_time_purchasable({"type": "weapon", "slot": "weapon", "rarity": "common"}) is True
    assert is_one_time_purchasable({"type": "weapon", "slot": "weapon", "rarity": "rare"}) is True

    # Legendary relics should be one-time
    assert is_one_time_purchasable({"type": "armor", "slot": "armor", "rarity": "legendary"}) is True
    assert is_one_time_purchasable({"type": "accessory", "slot": "accessory", "rarity": "legendary"}) is True

    # Consumable common/uncommon/rare armor, helmets, and accessories should NOT be one-time
    assert is_one_time_purchasable({"type": "armor", "slot": "armor", "rarity": "common"}) is False
    assert is_one_time_purchasable({"type": "helmet", "slot": "helmet", "rarity": "uncommon"}) is False
    assert is_one_time_purchasable({"type": "armor", "slot": "armor", "rarity": "uncommon"}) is False
    assert is_one_time_purchasable({"type": "accessory", "slot": "accessory", "rarity": "rare"}) is False

