"""
Boss catalog — 5 original bosses placed on the world map.
All names, lore, and stat values are original (not Elden Ring IP).
"""

BOSSES = [
    {
        "boss_key": "gravekeeper",
        "name": "The Gravekeeper",
        "lore": "A hulking figure bound in funeral chains, cursed to guard the ruins of the First City for eternity.",
        "hp": 200,
        "ap": 14,
        "defense": 4,
        "map_position": {"x": 18.0, "y": 72.0},
        "unlock_requirement": {"type": "grace_level", "value": 1},
        "rewards": {
            "echoes": 120,
            "runes": 150,
            "items": [
                {"item_key": "blessed_seal", "guaranteed": True},
            ],
        },
        "pixel_art_key": "boss_gravekeeper",
    },
    {
        "boss_key": "shadow_warden",
        "name": "Shadow Warden",
        "lore": "A spectral knight whose shadow devours all light. It patrols the cursed forest without rest.",
        "hp": 350,
        "ap": 22,
        "defense": 8,
        "map_position": {"x": 36.0, "y": 48.0},
        "unlock_requirement": {"type": "boss_defeated", "value": "gravekeeper"},
        "rewards": {
            "echoes": 200,
            "runes": 250,
            "items": [
                {"item_key": "rune_talisman", "guaranteed": True},
                {"item_key": "berserker_blade", "guaranteed": False, "drop_chance": 0.6},
            ],
        },
        "pixel_art_key": "boss_shadow_warden",
    },
    {
        "boss_key": "queen_of_ash",
        "name": "Queen of Ash",
        "lore": "Once a noble sorceress, she was consumed by forbidden flame. Now she reigns over a kingdom of cinders.",
        "hp": 550,
        "ap": 30,
        "defense": 12,
        "map_position": {"x": 55.0, "y": 64.0},
        "unlock_requirement": {"type": "grace_level", "value": 5},
        "rewards": {
            "echoes": 300,
            "runes": 350,
            "items": [
                {"item_key": "plate_armor", "guaranteed": True},
            ],
        },
        "pixel_art_key": "boss_queen_of_ash",
    },
    {
        "boss_key": "void_sovereign",
        "name": "Void Sovereign",
        "lore": "A being from beyond the veil of existence. It does not speak — it simply erases.",
        "hp": 750,
        "ap": 40,
        "defense": 18,
        "map_position": {"x": 74.0, "y": 38.0},
        "unlock_requirement": {"type": "boss_defeated", "value": "queen_of_ash"},
        "rewards": {
            "echoes": 450,
            "runes": 500,
            "items": [
                {"item_key": "dragonseal_armor", "guaranteed": False, "drop_chance": 0.7},
                {"item_key": "godslayer_sword", "guaranteed": False, "drop_chance": 0.5},
            ],
        },
        "pixel_art_key": "boss_void_sovereign",
    },
    {
        "boss_key": "eternal_sovereign",
        "name": "The Eternal Sovereign",
        "lore": "The last remnant of the old gods. To challenge it is to challenge fate itself.",
        "hp": 1100,
        "ap": 55,
        "defense": 24,
        "map_position": {"x": 88.0, "y": 18.0},
        "unlock_requirement": {"type": "grace_level", "value": 10},
        "rewards": {
            "echoes": 800,
            "runes": 800,
            "items": [
                {"item_key": "ancient_bulwark", "guaranteed": True},
                {"item_key": "elden_medallion", "guaranteed": True},
            ],
        },
        "pixel_art_key": "boss_eternal_sovereign",
    },
]
