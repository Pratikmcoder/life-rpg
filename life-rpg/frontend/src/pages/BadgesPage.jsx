import React, { useState, useEffect } from 'react'
import api from '../api/client'

const BADGE_ICONS = {
  first_light: '✨',
  tarnished_beginning: '🛡️',
  flame_keeper: '🔥',
  grace_seeker: '🌟',
  merchants_favorite: '💎',
  boss_slayer: '⚔️',
  week_of_grace: '🕯️',
  quest_veteran: '📜',
  golden_order: '👑',
  elden_champion: '🏆',
}

export const BadgesPage = () => {
  const [badges, setBadges] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadBadges = async () => {
      setIsLoading(true)
      try {
        const { data } = await api.get('/badges')
        setBadges(data.badges || [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadBadges()
  }, [])

  const earnedCount = badges.filter((b) => b.is_earned).length
  const totalCount = badges.length || 10
  const progressPct = Math.round((earnedCount / totalCount) * 100)

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1.2rem',
            color: 'var(--color-gold-bright)',
            marginBottom: '0.25rem',
          }}>
            HALL OF MEDALLIONS
          </h1>
        </div>

        {/* Progress Pill */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-gold)',
          padding: '0.6rem 1rem',
          minWidth: '180px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: 'var(--color-gold)', marginRight: '1rem' }}>
              MEDALLIONS
            </span>
            <span style={{ fontFamily: 'var(--font-stat)', fontSize: '1.25rem', color: '#fff', lineHeight: 1 }}>
              {earnedCount} / {totalCount}
            </span>
          </div>
          <div className="stat-bar-container" style={{ height: '8px' }}>
            <div className="stat-bar-fill stat-bar-fill-xp" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Polishing the Medallions...
        </div>
      ) : (
        <div className="grid-cols-3">
          {badges.map((badge) => {
            const isEarned = badge.is_earned
            const icon = BADGE_ICONS[badge.badge_key] || '🏅'

            return (
              <div
                key={badge.badge_key}
                className={isEarned ? 'pixel-panel-gold' : 'pixel-panel'}
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  opacity: isEarned ? 1 : 0.5,
                  background: isEarned ? 'rgba(201, 168, 76, 0.08)' : 'var(--color-surface)',
                }}
              >
                {/* Badge Icon */}
                <div style={{
                  fontSize: '2.2rem',
                  width: '54px',
                  height: '54px',
                  background: isEarned ? 'rgba(201, 168, 76, 0.2)' : 'rgba(0,0,0,0.4)',
                  border: `2px solid ${isEarned ? 'var(--color-gold-bright)' : 'var(--color-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: isEarned ? 'var(--color-gold-bright)' : 'var(--color-text-dim)',
                    marginBottom: '0.2rem',
                  }}>
                    {badge.name}
                  </div>

                  <p style={{
                    fontSize: '0.8rem',
                    color: isEarned ? 'var(--color-text)' : 'var(--color-text-muted)',
                    lineHeight: 1.3,
                    marginBottom: '0.5rem',
                  }}>
                    {badge.description}
                  </p>

                  <div style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.55rem',
                    color: isEarned ? 'var(--color-success-bright)' : 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                  }}>
                    {isEarned ? (
                      <span>✓ UNLOCKED {badge.earned_at ? `(${new Date(badge.earned_at).toLocaleDateString()})` : ''}</span>
                    ) : (
                      <span>🔒 LOCKED</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
