"""Badge definitions — 10 original achievements."""

BADGES = [
    {
        "badge_key": "first_light",
        "name": "First Light",
        "description": "Complete your first Quest.",
        "icon_key": "badge_first_light",
        "condition": {"type": "first_quest"},
    },
    {
        "badge_key": "tarnished_beginning",
        "name": "Tarnished's Beginning",
        "description": "Reach Grace Level 2.",
        "icon_key": "badge_level2",
        "condition": {"type": "grace_level", "level": 2},
    },
    {
        "badge_key": "flame_keeper",
        "name": "Flame Keeper",
        "description": "Maintain a 3-day Flame of Grace streak.",
        "icon_key": "badge_streak3",
        "condition": {"type": "streak", "days": 3},
    },
    {
        "badge_key": "grace_seeker",
        "name": "Grace Seeker",
        "description": "Reach Grace Level 5.",
        "icon_key": "badge_level5",
        "condition": {"type": "grace_level", "level": 5},
    },
    {
        "badge_key": "merchants_favorite",
        "name": "Merchant's Favorite",
        "description": "Make your first purchase from the Merchant's Vault.",
        "icon_key": "badge_purchase",
        "condition": {"type": "first_purchase"},
    },
    {
        "badge_key": "boss_slayer",
        "name": "Boss Slayer",
        "description": "Defeat your first Trial of the Demigod.",
        "icon_key": "badge_boss1",
        "condition": {"type": "first_boss"},
    },
    {
        "badge_key": "week_of_grace",
        "name": "Week of Grace",
        "description": "Maintain a 7-day Flame of Grace streak.",
        "icon_key": "badge_streak7",
        "condition": {"type": "streak", "days": 7},
    },
    {
        "badge_key": "quest_veteran",
        "name": "Quest Veteran",
        "description": "Complete 25 Quests in total.",
        "icon_key": "badge_quest25",
        "condition": {"type": "quest_total", "count": 25},
    },
    {
        "badge_key": "golden_order",
        "name": "Golden Order",
        "description": "Reach Grace Level 10.",
        "icon_key": "badge_level10",
        "condition": {"type": "grace_level", "level": 10},
    },
    {
        "badge_key": "elden_champion",
        "name": "Elden Champion",
        "description": "Defeat all five Trials of the Demigod.",
        "icon_key": "badge_all_bosses",
        "condition": {"type": "all_bosses"},
    },
]
