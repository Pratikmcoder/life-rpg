"""
Deterministic turn-based boss combat simulator.
Runs entirely server-side. Client receives the battle_log to animate.
"""
from typing import TypedDict

MAX_TURNS = 100  # safety cap to prevent infinite loops


class TurnEntry(TypedDict):
    turn: int
    actor: str        # "player" or "boss"
    action: str
    attack_power: int
    defense: int
    damage: int
    player_hp_after: int
    boss_hp_after: int


def simulate_boss_fight(
    player_vigor: int,
    player_strength: int,
    player_poise: int,
    boss_hp: int,
    boss_ap: int,
    boss_defense: int,
) -> dict:
    """
    Simulate a full boss fight deterministically.

    Formula:
      - Player damage to boss = max(1, player_strength - boss_defense)
      - Boss damage to player = max(1, boss_ap - player_poise)
    """
    current_player_hp = player_vigor
    current_boss_hp = boss_hp

    battle_log: list[TurnEntry] = []
    turn = 1

    while current_player_hp > 0 and current_boss_hp > 0 and turn <= MAX_TURNS:
        # --- Player attacks boss ---
        player_damage = max(1, player_strength - boss_defense)
        current_boss_hp -= player_damage
        current_boss_hp = max(0, current_boss_hp)

        battle_log.append({
            "turn": turn,
            "actor": "player",
            "action": "attack",
            "attack_power": player_strength,
            "defense": boss_defense,
            "damage": player_damage,
            "player_hp_after": current_player_hp,
            "boss_hp_after": current_boss_hp,
        })

        if current_boss_hp <= 0:
            break  # victory

        # --- Boss attacks player ---
        boss_damage = max(1, boss_ap - player_poise)
        current_player_hp -= boss_damage
        current_player_hp = max(0, current_player_hp)

        battle_log.append({
            "turn": turn,
            "actor": "boss",
            "action": "attack",
            "attack_power": boss_ap,
            "defense": player_poise,
            "damage": boss_damage,
            "player_hp_after": current_player_hp,
            "boss_hp_after": current_boss_hp,
        })

        turn += 1

    outcome = "victory" if current_boss_hp <= 0 else "defeat"

    return {
        "outcome": outcome,
        "battle_log": battle_log,
        "player_hp_remaining": current_player_hp,
    }
