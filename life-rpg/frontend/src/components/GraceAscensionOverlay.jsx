import React from 'react'
import { useAuth } from '../context/AuthContext'
import { playSound } from '../utils/sfx'

export const GraceAscensionOverlay = () => {
  const { levelUpData, clearLevelUp, soundMuted } = useAuth()

  if (!levelUpData) return null

  const { oldLevel = 1, newLevel = 2 } = levelUpData

  const handleClaim = () => {
    playSound('click', soundMuted)
    clearLevelUp()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(5, 5, 10, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        className="pixel-panel-gold"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #181926 0%, #0d0d15 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative Golden Crest */}
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }} className="flame-flicker">
          👑
        </div>

        <div
          style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1.2rem',
            color: 'var(--color-gold-bright)',
            textShadow: '0 0 15px var(--color-gold-glow), 0 0 30px rgba(241, 196, 15, 0.6)',
            letterSpacing: '2px',
            marginBottom: '0.5rem',
          }}
        >
          GRACE ASCENSION
        </div>

        <p style={{ fontFamily: 'var(--font-title)', color: 'var(--color-text-dim)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Your lost Grace has grown brighter across the Lands Between.
        </p>

        {/* Level Transition Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(201, 168, 76, 0.15)',
            border: '2px solid var(--color-gold-dim)',
            padding: '0.75rem 1.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ fontFamily: 'var(--font-stat)', fontSize: '2.2rem', color: 'var(--color-text-muted)' }}>
            LVL {oldLevel}
          </span>
          <span style={{ color: 'var(--color-gold-bright)', fontSize: '1.5rem' }}>➔</span>
          <span style={{ fontFamily: 'var(--font-stat)', fontSize: '2.8rem', color: 'var(--color-gold-bright)', fontWeight: 'bold' }}>
            LVL {newLevel}
          </span>
        </div>

        {/* Stat Gains Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem',
            textAlign: 'center',
          }}
        >
          <div style={{ background: 'rgba(139, 26, 26, 0.2)', border: '1px solid #6b1b1b', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-pixel)', color: '#e74c3c' }}>VIGOR</div>
            <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.8rem', color: '#ff7675' }}>+10 HP</div>
          </div>
          <div style={{ background: 'rgba(201, 168, 76, 0.2)', border: '1px solid #7a6530', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-pixel)', color: '#f1c40f' }}>STRENGTH</div>
            <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.8rem', color: '#ffeaa7' }}>+3 AP</div>
          </div>
          <div style={{ background: 'rgba(127, 140, 141, 0.2)', border: '1px solid #4a5455', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-pixel)', color: '#bdc3c7' }}>POISE</div>
            <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.8rem', color: '#dfe6e9' }}>+2 DEF</div>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-success-bright)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
          ✨ Vigor (HP) fully restored to maximum!
        </div>

        <button
          onClick={handleClaim}
          className="pixel-btn pixel-btn-gold"
          style={{
            width: '100%',
            padding: '0.9rem',
            fontSize: '0.9rem',
          }}
        >
          CLAIM YOUR POWER
        </button>
      </div>
    </div>
  )
}
