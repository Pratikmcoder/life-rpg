import pytest
from app.services.boss_engine import simulate_boss_fight


def test_player_wins_when_strong():
    res = simulate_boss_fight(
        player_vigor=500,
        player_strength=100,
        player_poise=50,
        boss_hp=50,
        boss_ap=10,
        boss_defense=5,
    )
    assert res["outcome"] == "victory"
    assert len(res["battle_log"]) > 0
    assert res["player_hp_remaining"] > 0


def test_player_loses_when_weak():
    res = simulate_boss_fight(
        player_vigor=10,
        player_strength=2,
        player_poise=0,
        boss_hp=500,
        boss_ap=50,
        boss_defense=20,
    )
    assert res["outcome"] == "defeat"
    assert len(res["battle_log"]) > 0


def test_battle_log_structure():
    res = simulate_boss_fight(
        player_vigor=100,
        player_strength=25,
        player_poise=5,
        boss_hp=80,
        boss_ap=15,
        boss_defense=5,
    )
    log = res["battle_log"]
    assert len(log) > 0
    for entry in log:
        assert "turn" in entry
        assert entry["actor"] in ["player", "boss"]
        assert entry["action"] == "attack"
        assert entry["damage"] >= 1
        assert "player_hp_after" in entry
        assert "boss_hp_after" in entry
