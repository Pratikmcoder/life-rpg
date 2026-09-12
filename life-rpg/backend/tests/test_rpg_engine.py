import pytest
from app.services.rpg_engine import (
    total_runes_for_level,
    compute_level,
    compute_level_details,
    compute_base_stats,
    REWARD_TABLE,
    MAX_LEVEL,
)


def test_level_1_zero_runes():
    assert compute_level(0) == 1
    res = compute_level_details(0)
    assert res["level"] == 1
    assert res["current_runes"] == 0
    assert res["progress_pct"] == 0.0


def test_non_linear_progression_growth():
    """Verify that delta between successive levels increases strictly non-linearly."""
    prev_cost = 0
    for lvl in range(2, MAX_LEVEL + 1):
        cost = total_runes_for_level(lvl) - total_runes_for_level(lvl - 1)
        assert cost > prev_cost, f"Level {lvl} cost ({cost}) should be greater than level {lvl-1} cost ({prev_cost})"
        prev_cost = cost


def test_compute_level_exact_thresholds():
    for lvl in range(1, MAX_LEVEL + 1):
        req = total_runes_for_level(lvl)
        lvl_val = compute_level(req)
        assert lvl_val == lvl
        details = compute_level_details(req)
        assert details["level"] == lvl
        assert details["grace_level"] == lvl


def test_compute_base_stats():
    lvl1 = compute_base_stats(1)
    lvl5 = compute_base_stats(5)
    lvl10 = compute_base_stats(10)

    assert lvl1["base_vigor"] == 100
    assert lvl1["base_strength"] == 10
    assert lvl1["base_poise"] == 0

    assert lvl5["base_vigor"] > lvl1["base_vigor"]
    assert lvl5["base_strength"] > lvl1["base_strength"]
    assert lvl5["base_poise"] > lvl1["base_poise"]

    assert lvl10["base_vigor"] > lvl5["base_vigor"]
    assert lvl10["base_strength"] > lvl5["base_strength"]
    assert lvl10["base_poise"] > lvl5["base_poise"]


def test_reward_table_values():
    assert REWARD_TABLE["trivial"]["runes"] < REWARD_TABLE["common"]["runes"]
    assert REWARD_TABLE["common"]["runes"] < REWARD_TABLE["challenging"]["runes"]
    assert REWARD_TABLE["challenging"]["runes"] < REWARD_TABLE["legendary"]["runes"]

    assert REWARD_TABLE["trivial"]["echoes"] < REWARD_TABLE["common"]["echoes"]
    assert REWARD_TABLE["common"]["echoes"] < REWARD_TABLE["challenging"]["echoes"]
    assert REWARD_TABLE["challenging"]["echoes"] < REWARD_TABLE["legendary"]["echoes"]
