import math

MAX_LEVEL = 20

# Precomputed non-linear cumulative rune thresholds for levels 1 to 20
# Each level cost grows strictly non-linearly: cost(n) = 100 + round(75 * ((n - 1) ** 1.7))
_LEVEL_THRESHOLDS = [0] * (MAX_LEVEL + 1)
_LEVEL_COSTS = [0] * (MAX_LEVEL + 1)

_cum = 0
for _lvl in range(1, MAX_LEVEL + 1):
    if _lvl == 1:
        _cost = 0
    elif _lvl == 2:
        _cost = 100
    else:
        _cost = 100 + int(75 * ((_lvl - 1) ** 1.7))
    _cum += _cost
    _LEVEL_THRESHOLDS[_lvl] = _cum
    _LEVEL_COSTS[_lvl] = _cost


def total_runes_for_level(n: int) -> int:
    """Runes required to REACH level n from level 1 (strictly non-linear)."""
    if n <= 1:
        return 0
    if n > MAX_LEVEL:
        return _LEVEL_THRESHOLDS[MAX_LEVEL]
    return _LEVEL_THRESHOLDS[n]


def compute_level(total_runes: int) -> int:
    """Derive grace_level (int 1..MAX_LEVEL) from cumulative total_runes earned."""
    if total_runes <= 0:
        return 1
    for lvl in range(MAX_LEVEL, 1, -1):
        if total_runes >= _LEVEL_THRESHOLDS[lvl]:
            return lvl
    return 1


def runes_for_current_level(total_runes: int) -> int:
    """Runes accumulated within the current level (progress toward next)."""
    level = compute_level(total_runes)
    if level >= MAX_LEVEL:
        return total_runes - _LEVEL_THRESHOLDS[MAX_LEVEL]
    current_thresh = _LEVEL_THRESHOLDS[level]
    return max(0, total_runes - current_thresh)


def runes_needed_for_next_level(total_runes: int) -> int:
    """Runes required to advance from the current level to next."""
    level = compute_level(total_runes)
    if level >= MAX_LEVEL:
        return 0
    next_thresh = _LEVEL_THRESHOLDS[level + 1]
    current_thresh = _LEVEL_THRESHOLDS[level]
    return next_thresh - current_thresh


def compute_level_details(total_runes: int) -> dict:
    """Detailed level breakdown including current runes, needed runes, and progress pct."""
    level = compute_level(total_runes)
    current_runes = runes_for_current_level(total_runes)
    needed = runes_needed_for_next_level(total_runes)
    progress_pct = 100.0 if level >= MAX_LEVEL or needed == 0 else round((current_runes / needed) * 100, 1)

    return {
        "level": level,
        "grace_level": level,
        "current_runes": current_runes,
        "runes_in_level": current_runes,
        "needed_runes": needed,
        "next_level_runes": needed,
        "runes_to_next_level": needed,
        "total_runes": total_runes,
        "progress_pct": progress_pct,
        "is_max_level": level >= MAX_LEVEL,
    }


def compute_base_stats(level: int) -> dict:
    """Base stats at given level (before item bonuses)."""
    return {
        "base_vigor": 100 + (level - 1) * 15,
        "base_strength": 10 + (level - 1) * 4,
        "base_poise": 0 + (level - 1) * 3,
    }


# XP reward per difficulty
RUNE_REWARDS = {
    "trivial": 25,
    "common": 75,
    "challenging": 150,
    "legendary": 300,
}

ECHO_REWARDS = {
    "trivial": 5,
    "common": 15,
    "challenging": 30,
    "legendary": 60,
}

REWARD_TABLE = {
    k: {"runes": RUNE_REWARDS[k], "echoes": ECHO_REWARDS[k]}
    for k in RUNE_REWARDS
}

STREAK_DAILY_THRESHOLD = 100  # runes required per day to maintain streak
