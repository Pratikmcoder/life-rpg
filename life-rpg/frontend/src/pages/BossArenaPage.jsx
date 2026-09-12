import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sfx'
import { PixelAvatar } from '../components/PixelAvatar'

export const BossArenaPage = () => {
  const { bossId } = useParams()
  const { character, fetchCharacter, soundMuted, triggerLevelUp } = useAuth()
  const { addToast } = useToast()

  const [boss, setBoss] = useState(null)
  const [battleState, setBattleState] = useState('ready') // 'ready' | 'fighting' | 'victory' | 'defeat'
  const [battleLog, setBattleLog] = useState([])
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0)
  const [playerHp, setPlayerHp] = useState(100)
  const [bossHp, setBossHp] = useState(100)
  const [fightResult, setFightResult] = useState(null)
  const [activeDamageEffect, setActiveDamageEffect] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const maxPlayerHp = character?.effective_vigor || character?.base_vigor || 100
  const maxBossHp = boss?.hp || 100

  const initArena = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get(`/bosses/${bossId}`)
      setBoss(data)
      setBossHp(data.hp)
      // Character is always at 100% full base HP
      setPlayerHp(character?.effective_vigor || character?.base_vigor || 100)
      setBattleState('ready')
      setBattleLog([])
      setCurrentTurnIdx(0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initArena()
  }, [bossId, character?.effective_vigor])

  const startFight = async () => {
    // Reset to full HP before every battle
    setPlayerHp(maxPlayerHp)
    setBossHp(maxBossHp)
    setBattleState('fighting')
    playSound('hit', soundMuted)

    try {
      const { data } = await api.post(`/bosses/${bossId}/fight`)
      setFightResult(data)
      setBattleLog(data.battle_log || [])
      setCurrentTurnIdx(0)

      // Start animated turn playback
      playBattleSequence(data.battle_log || [], data)
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Battle Error',
        message: err.response?.data?.detail || 'Failed to initiate combat.',
        type: 'error',
      })
      setBattleState('ready')
    }
  }

  const playBattleSequence = (turns, finalData) => {
    let step = 0
    const interval = setInterval(() => {
      if (step >= turns.length) {
        clearInterval(interval)
        finishBattle(finalData)
        return
      }

      const turn = turns[step]
      setCurrentTurnIdx(step)
      setPlayerHp(turn.player_hp_after)
      setBossHp(turn.boss_hp_after)

      // SFX & damage popup
      playSound('hit', soundMuted)
      setActiveDamageEffect({
        target: turn.actor === 'player' ? 'boss' : 'player',
        damage: turn.damage,
      })

      setTimeout(() => {
        setActiveDamageEffect(null)
      }, 400)

      step++
    }, 650)
  }

  const finishBattle = async (data) => {
    await fetchCharacter()

    if (data.shield_consumed) {
      addToast({
        title: 'Gear Consumed in Battle',
        message: `Your equipped ${data.consumed_shield_name || 'gear'} was consumed defending in combat.`,
        type: 'info',
      })
    }

    if (data.outcome === 'victory') {
      setBattleState('victory')
      playSound('victory', soundMuted)

      if (data.first_time_victory) {
        addToast({
          title: 'DEMIGOD FELLED!',
          message: `First Victory: +${data.runes_earned} Runes, +${data.echoes_earned} Echoes!`,
          type: 'runes',
        })
      } else {
        addToast({
          title: 'DEMIGOD REMATCH WON!',
          message: 'Boss was previously defeated. No additional Runes or Echoes awarded.',
          type: 'info',
        })
      }

      if (data.newly_awarded_badges?.length > 0) {
        data.newly_awarded_badges.forEach((bKey) => {
          addToast({
            title: 'Medallion Unlocked!',
            message: `Earned "${bKey.replace(/_/g, ' ').toUpperCase()}" medallion!`,
            type: 'badge',
          })
        })
      }
    } else {
      setBattleState('defeat')
      playSound('defeat', soundMuted)
    }
  }

  const resetBattle = () => {
    setPlayerHp(maxPlayerHp)
    setBossHp(maxBossHp)
    setBattleState('ready')
    setBattleLog([])
    setCurrentTurnIdx(0)
    playSound('click', soundMuted)
  }

  if (isLoading || !boss) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--color-text-dim)' }}>Summoning the Demigod Arena...</p>
      </div>
    )
  }

  const playerHpPct = Math.max(0, Math.min(100, (playerHp / maxPlayerHp) * 100))
  const bossHpPct = Math.max(0, Math.min(100, (bossHp / maxBossHp) * 100))

  return (
    <div className="app-container" style={{ maxWidth: '960px' }}>
      {/* Arena Title */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.7rem',
          color: 'var(--color-crimson-bright)',
          textTransform: 'uppercase',
          marginBottom: '0.35rem',
        }}>
          ⚔️ TRIAL OF THE DEMIGOD
        </div>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '1.8rem',
          color: 'var(--color-gold-bright)',
        }}>
          {boss.name}
        </h1>
      </div>

      {/* Combat Visual Stage */}
      <div
        className="pixel-panel-crimson"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(91, 45, 142, 0.35) 0%, #0c0d15 85%)',
          padding: '2rem 1.5rem',
          marginBottom: '1.5rem',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Health Bars Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Player HP */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'var(--color-gold)' }}>
                {character?.name || 'TARNISHED'}
              </span>
              <span style={{ fontFamily: 'var(--font-stat)', fontSize: '1.2rem', color: '#ff7675' }}>
                {playerHp} / {maxPlayerHp} HP
              </span>
            </div>
            <div className="stat-bar-container" style={{ height: '14px' }}>
              <div className="stat-bar-fill stat-bar-fill-hp" style={{ width: `${playerHpPct}%` }} />
            </div>
          </div>

          {/* Boss HP */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'var(--color-arcane-bright)' }}>
                {boss.name}
              </span>
              <span style={{ fontFamily: 'var(--font-stat)', fontSize: '1.2rem', color: '#a29bfe' }}>
                {bossHp} / {maxBossHp} HP
              </span>
            </div>
            <div className="stat-bar-container" style={{ height: '14px' }}>
              <div className="stat-bar-fill stat-bar-fill-boss" style={{ width: `${bossHpPct}%` }} />
            </div>
          </div>
        </div>

        {/* Sprites & Combat Center Stage */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '2rem 1rem',
          position: 'relative',
        }}>
          {/* Player Sprite & Damage */}
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <PixelAvatar size={96} level={character?.grace_level || 1} />
            <div style={{
              fontFamily: 'var(--font-title)',
              fontSize: '0.85rem',
              color: 'var(--color-gold-bright)',
              marginTop: '0.5rem',
            }}>
              ATK: {character?.effective_strength || 10} | DEF: {character?.effective_poise || 0}
            </div>

            {activeDamageEffect?.target === 'player' && (
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: 'var(--font-stat)',
                fontSize: '2.8rem',
                color: '#e74c3c',
                textShadow: '0 0 10px #000',
                fontWeight: 'bold',
              }}>
                -{activeDamageEffect.damage}
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1.2rem',
            color: 'var(--color-border-bright)',
          }}>
            VS
          </div>

          {/* Boss Sprite & Damage */}
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{
              width: '96px',
              height: '96px',
              background: '#150f1d',
              border: '2px solid var(--color-arcane-bright)',
              boxShadow: '0 0 15px var(--color-arcane-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3.5rem',
            }}>
              👹
            </div>
            <div style={{
              fontFamily: 'var(--font-title)',
              fontSize: '0.85rem',
              color: 'var(--color-arcane-bright)',
              marginTop: '0.5rem',
            }}>
              ATK: {boss.ap} | DEF: {boss.defense}
            </div>

            {activeDamageEffect?.target === 'boss' && (
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: 'var(--font-stat)',
                fontSize: '2.8rem',
                color: '#f1c40f',
                textShadow: '0 0 10px #000',
                fontWeight: 'bold',
              }}>
                -{activeDamageEffect.damage}
              </div>
            )}
          </div>
        </div>

        {/* Combat Action Controls */}
        <div style={{ textAlign: 'center' }}>
          {battleState === 'ready' && (
            <button
              onClick={startFight}
              className="pixel-btn pixel-btn-crimson"
              style={{ padding: '0.9rem 2.5rem', fontSize: '0.9rem' }}
            >
              ⚔️ COMMENCE BATTLE (FULL HP)
            </button>
          )}

          {battleState === 'fighting' && (
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', color: 'var(--color-gold-bright)' }}>
              ⚡ Clashing steel and shadows... (Turn {currentTurnIdx + 1}/{battleLog.length})
            </div>
          )}

          {battleState === 'victory' && (
            <div>
              <div style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '1.2rem',
                color: 'var(--color-gold-bright)',
                marginBottom: '0.4rem',
                textShadow: '0 0 15px var(--color-gold-glow)',
              }}>
                👑 {fightResult?.first_time_victory ? 'DEMIGOD FELLED' : 'DEMIGOD REMATCH WON'}
              </div>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {fightResult?.first_time_victory
                  ? `Spoils Claimed: +${fightResult?.runes_earned || 0} Runes, +${fightResult?.echoes_earned || 0} Echoes!`
                  : 'Boss was previously conquered. No additional Runes or Echoes granted for rematches.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={resetBattle}
                  className="pixel-btn pixel-btn-gold"
                  style={{ fontSize: '0.75rem' }}
                >
                  ⚔️ Replay Trial
                </button>
                <Link to="/map" className="pixel-btn" style={{ fontSize: '0.75rem' }}>
                  🗺️ Return to World Map
                </Link>
              </div>
            </div>
          )}

          {battleState === 'defeat' && (
            <div>
              <div style={{
                fontFamily: 'var(--font-pixel)',
                fontSize: '1.4rem',
                color: '#e74c3c',
                marginBottom: '1rem',
                textShadow: '0 0 15px var(--color-crimson-glow)',
              }}>
                💀 YOU DIED
              </div>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Your strength was insufficient. Your HP has been fully restored to {maxPlayerHp}. Inscribe quests to gain Runes and equip relics!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={startFight}
                  className="pixel-btn pixel-btn-crimson"
                  style={{ fontSize: '0.75rem' }}
                >
                  ⚔️ Challenge Again (Full HP)
                </button>
                <Link to="/inventory" className="pixel-btn" style={{ fontSize: '0.75rem' }}>
                  🎒 Optimize Loadout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
