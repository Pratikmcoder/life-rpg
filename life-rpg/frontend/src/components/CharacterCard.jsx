import React from 'react'
import { Link } from 'react-router-dom'
import { PixelAvatar } from './PixelAvatar'
import { useAuth } from '../context/AuthContext'

export const CharacterCard = ({ stretch = false, hideStreak = false }) => {
  const { character } = useAuth()

  if (!character) {
    return (
      <div className="pixel-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-dim)' }}>Summoning Tarnished...</p>
      </div>
    )
  }

  const {
    name = 'Tarnished',
    grace_level = 1,
    level = 1,
    base_vigor = 100,
    base_strength = 10,
    base_poise = 0,
    effective_vigor = 100,
    effective_strength = 10,
    effective_poise = 0,
    current_runes = 0,
    runes_in_level = 0,
    next_level_runes = 100,
    runes_to_next_level = 100,
    total_runes = 0,
    progress_pct = 0,
    streak = 0,
    daily_runes_today = 0,
  } = character

  const currentLevel = grace_level || level || 1
  const baseCurrent = current_runes ?? runes_in_level ?? 0
  const baseNeeded = next_level_runes ?? runes_to_next_level ?? 100
  const displayCurrentRunes = total_runes ?? 0
  const displayNeededRunes = displayCurrentRunes - baseCurrent + baseNeeded
  const displayProgressPct = progress_pct ?? (baseNeeded > 0 ? Math.round((baseCurrent / baseNeeded) * 100) : 100)
  const streakPercent = Math.min(100, (daily_runes_today / 100) * 100)

  return (
    <div className="pixel-panel" style={{ padding: '1.25rem', height: stretch ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Character Info Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
        <PixelAvatar size={72} level={currentLevel} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.9rem',
            color: 'var(--color-gold-bright)',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            marginBottom: '0.25rem',
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: 'var(--font-title)',
            fontSize: '0.8rem',
            color: 'var(--color-text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Grace Level {currentLevel} Tarnished
          </div>
        </div>
      </div>

      {/* 2. XP Counter & Progression Bar (Shown directly below Character Info) */}
      <div style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid var(--color-border)',
        padding: '0.85rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'var(--color-rune)' }}>
            RUNES
          </span>
          <span style={{ fontFamily: 'var(--font-stat)', fontSize: '1.2rem', color: 'var(--color-gold-bright)' }}>
            {displayCurrentRunes} / {displayNeededRunes}
          </span>
        </div>
        <div className="stat-bar-container" style={{ height: '12px', marginBottom: '0.4rem' }}>
          <div
            className="stat-bar-fill stat-bar-fill-xp"
            style={{ width: `${displayProgressPct}%` }}
          />
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginTop: '0.35rem' }}>
          <span>TOTAL RUNES COLLECTED: {displayCurrentRunes}</span>
        </div>
      </div>

      {/* 3. Clubbed Combat Attributes: Base HP, Base AP, and Defense */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        textAlign: 'center',
      }}>
        {/* Base HP */}
        <div style={{
          background: 'rgba(139, 26, 26, 0.15)',
          border: '1px solid #751a1a',
          padding: '0.6rem 0.4rem',
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', color: '#e74c3c', marginBottom: '0.2rem' }}>
            VIGOR
          </div>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#ff7675', lineHeight: 1 }}>
            {effective_vigor || base_vigor}
          </div>
        </div>

        {/* Base AP */}
        <div style={{
          background: 'rgba(201, 168, 76, 0.15)',
          border: '1px solid #7a6530',
          padding: '0.6rem 0.4rem',
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', color: '#f1c40f', marginBottom: '0.2rem' }}>
            ATTACK
          </div>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#ffeaa7', lineHeight: 1 }}>
            {effective_strength || base_strength}
          </div>
        </div>

        {/* Defense */}
        <div style={{
          background: 'rgba(127, 140, 141, 0.15)',
          border: '1px solid #4e595a',
          padding: '0.6rem 0.4rem',
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', color: '#bdc3c7', marginBottom: '0.2rem' }}>
            POISE
          </div>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#dfe6e9', lineHeight: 1 }}>
            {effective_poise || base_poise}
          </div>
        </div>
      </div>

      {/* 4. Daily Flame Streak Tracker */}
      {!hideStreak && (
        <div style={{
        background: 'rgba(230, 126, 34, 0.08)',
        border: '1px solid rgba(230, 126, 34, 0.25)',
        padding: '0.75rem',
        marginTop: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#f39c12', fontWeight: 'bold' }}>
            Today's Flame Fuel
          </span>
          <span style={{ fontFamily: 'var(--font-stat)', fontSize: '1.1rem', color: '#f39c12' }}>
            {daily_runes_today} / 100 Runes
          </span>
        </div>
        <div className="stat-bar-container" style={{ height: '8px' }}>
          <div
            className="stat-bar-fill"
            style={{
              width: `${streakPercent}%`,
              background: 'linear-gradient(90deg, #d35400, #f39c12)',
            }}
          />
        </div>
        </div>
      )}
    </div>
  )
}
