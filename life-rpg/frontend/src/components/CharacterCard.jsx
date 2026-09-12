import React from 'react'
import { Link } from 'react-router-dom'
import { PixelAvatar } from './PixelAvatar'
import { useAuth } from '../context/AuthContext'

export const CharacterCard = () => {
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
  const displayCurrentRunes = current_runes ?? runes_in_level ?? 0
  const displayNeededRunes = next_level_runes ?? runes_to_next_level ?? 100
  const displayProgressPct = progress_pct ?? (displayNeededRunes > 0 ? Math.round((displayCurrentRunes / displayNeededRunes) * 100) : 100)
  const streakPercent = Math.min(100, (daily_runes_today / 100) * 100)

  return (
    <div className="pixel-panel" style={{ padding: '1.25rem' }}>
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: '0.35rem',
            fontSize: '0.85rem',
            color: streak > 0 ? '#ff9f43' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-stat)',
          }}>
            <span>🔥</span>
            <span>{streak} Day Flame Streak</span>
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
            RUNES (XP)
          </span>
          <span style={{ fontFamily: 'var(--font-stat)', fontSize: '1.2rem', color: 'var(--color-gold-bright)' }}>
            {displayCurrentRunes} / {displayNeededRunes} ({displayProgressPct}%)
          </span>
        </div>
        <div className="stat-bar-container" style={{ height: '12px', marginBottom: '0.4rem' }}>
          <div
            className="stat-bar-fill stat-bar-fill-xp"
            style={{ width: `${displayProgressPct}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          <span>Total Gathered: {total_runes} Runes</span>
          <span>Next: +{Math.max(0, displayNeededRunes - displayCurrentRunes)} XP</span>
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
            BASE HP
          </div>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#ff7675', lineHeight: 1 }}>
            {effective_vigor || base_vigor}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Vigor
          </div>
        </div>

        {/* Base AP */}
        <div style={{
          background: 'rgba(201, 168, 76, 0.15)',
          border: '1px solid #7a6530',
          padding: '0.6rem 0.4rem',
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', color: '#f1c40f', marginBottom: '0.2rem' }}>
            BASE AP
          </div>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#ffeaa7', lineHeight: 1 }}>
            {effective_strength || base_strength}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Attack
          </div>
        </div>

        {/* Defense */}
        <div style={{
          background: 'rgba(127, 140, 141, 0.15)',
          border: '1px solid #4e595a',
          padding: '0.6rem 0.4rem',
        }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem', color: '#bdc3c7', marginBottom: '0.2rem' }}>
            DEFENSE
          </div>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#dfe6e9', lineHeight: 1 }}>
            {effective_poise || base_poise}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Poise
          </div>
        </div>
      </div>

      {/* 4. Daily Flame Streak Tracker */}
      <div style={{
        background: 'rgba(230, 126, 34, 0.08)',
        border: '1px solid rgba(230, 126, 34, 0.25)',
        padding: '0.75rem',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#f39c12', fontWeight: 'bold' }}>
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
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
          Earn 100 Runes today to maintain your Flame streak.
        </div>
      </div>
    </div>
  )
}
