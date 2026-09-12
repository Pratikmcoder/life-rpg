import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { playSound } from '../utils/sfx'

export const LandingPage = () => {
  const { isAuthenticated, isLoading, soundMuted } = useAuth()

  // Wait for initial session restore
  if (isLoading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-gold)',
        fontFamily: 'var(--font-pixel)',
        fontSize: '0.85rem',
      }}>
        Awakening Grace...
      </div>
    )
  }

  // If already authenticated, redirect directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleClick = () => {
    playSound('click', soundMuted)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section style={{
        padding: '5rem 1rem 4rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(201, 168, 76, 0.12) 0%, rgba(11, 12, 16, 0.9) 70%)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Flame Icon */}
          <div style={{ display: 'inline-block', marginBottom: '1.25rem' }}>
            <img
              src="/flame.svg"
              alt="Elden Flame"
              style={{ width: '64px', height: '64px' }}
              className="flame-flicker"
            />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: 'var(--color-gold-bright)',
            textShadow: '0 0 20px var(--color-gold-glow), 0 0 40px rgba(241, 196, 15, 0.4)',
            lineHeight: 1.4,
            marginBottom: '1.25rem',
            letterSpacing: '2px',
          }}>
            RECLAIM YOUR GRACE
          </h1>

          <p style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.25rem',
            color: 'var(--color-text)',
            lineHeight: 1.6,
            marginBottom: '2rem',
            letterSpacing: '0.5px',
          }}>
            Transform your mundane daily routines into an epic dark-fantasy RPG progression.
            Conquer real quests, gather Runes, forge legendary gear, and vanquish the Demigods of the Lands Between.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={handleClick}
                className="pixel-btn pixel-btn-gold"
                style={{ padding: '0.9rem 1.8rem', fontSize: '0.85rem' }}
              >
                ⚔️ Enter The Lands Between
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={handleClick}
                  className="pixel-btn pixel-btn-gold"
                  style={{ padding: '0.9rem 1.8rem', fontSize: '0.85rem' }}
                >
                  👑 Begin Your Journey
                </Link>
                <Link
                  to="/login"
                  onClick={handleClick}
                  className="pixel-btn"
                  style={{ padding: '0.9rem 1.8rem', fontSize: '0.85rem' }}
                >
                  Return, Tarnished
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem', flex: 1 }}>
        <h2 style={{
          textAlign: 'center',
          fontFamily: 'var(--font-title)',
          fontSize: '1.8rem',
          color: 'var(--color-gold)',
          marginBottom: '3rem',
        }}>
          Core Progression Pillars
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.75rem',
        }}>
          {/* Pillar 1 */}
          <div className="pixel-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📜</div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#fff', marginBottom: '0.6rem' }}>
              Real-World Quests
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Inscribe your daily tasks across 4 difficulty tiers: Trivial, Common, Challenging, and Legendary.
              Earn immediate Runes (XP) and Echoes (Currency).
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="pixel-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔥</div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#fff', marginBottom: '0.6rem' }}>
              Flame of Grace
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Hit your 100-Rune daily fuel threshold to keep your Flame streak blazing.
              Never let your Grace fade into darkness.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="pixel-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏛️</div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#fff', marginBottom: '0.6rem' }}>
              Merchant's Vault
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Spend hard-earned Echoes on weapons, armor, talismans, and healing flasks.
              Equipping gear enhances your actual Vigor, Strength, and Poise stats.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="pixel-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗺️</div>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', color: '#fff', marginBottom: '0.6rem' }}>
              Trials of the Demigod
            </h3>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Venture across the interactive World Map to challenge 5 fearsome pixel-art Bosses in deterministic turn-based combat.
              Win rare legendary drops!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        Life RPG &copy; 2026 — Reclaim the Elden Ring with Productivity.
      </footer>
    </div>
  )
}
