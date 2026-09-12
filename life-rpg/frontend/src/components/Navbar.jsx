import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { playSound } from '../utils/sfx'

export const Navbar = () => {
  const { character, isAuthenticated, logout, soundMuted, toggleSound } = useAuth()
  const location = useLocation()

  // Do not load or render navbar before the user logs in
  if (!isAuthenticated) {
    return null
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '⚔️' },
    { label: 'Quests', path: '/quests', icon: '📜' },
    { label: 'Merchant', path: '/shop', icon: '🏛️' },
    { label: 'Pouch', path: '/inventory', icon: '🎒' },
    { label: 'World Map', path: '/map', icon: '🗺️' },
    { label: 'Medallions', path: '/badges', icon: '🏅' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ]

  const handleNavClick = () => {
    playSound('click', soundMuted)
  }

  return (
    <header style={{
      background: 'rgba(14, 15, 23, 0.95)',
      borderBottom: '2px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        {/* Brand */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          onClick={handleNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
          }}
        >
          <img src="/flame.svg" alt="Life RPG Flame" style={{ width: '28px', height: '28px' }} className="flame-flicker" />
          <span style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1rem',
            color: 'var(--color-gold)',
            textShadow: '0 0 8px var(--color-gold-glow)',
            letterSpacing: '1px',
          }}>
            LIFE RPG
          </span>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated && (
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexWrap: 'wrap',
          }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-title)',
                    fontWeight: '600',
                    color: isActive ? 'var(--color-gold-bright)' : 'var(--color-text-dim)',
                    background: isActive ? 'rgba(201, 168, 76, 0.12)' : 'transparent',
                    border: isActive ? '1px solid var(--color-gold-dim)' : '1px solid transparent',
                    borderRadius: '2px',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right Status Pill & Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          {isAuthenticated && character && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-bright)',
              padding: '0.3rem 0.6rem',
              borderRadius: '2px',
              fontSize: '0.85rem',
            }}>
              {/* Flame Streak */}
              <div
                title="Flame of Grace (Streak Days)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontFamily: 'var(--font-stat)',
                  fontSize: '1.2rem',
                  color: character.streak > 0 ? '#ff793f' : 'var(--color-text-muted)',
                }}
              >
                <span>🔥</span>
                <span>{character.streak || 0}d</span>
              </div>

              <div style={{ width: '1px', height: '14px', background: 'var(--color-border)' }} />

              {/* Echoes (Currency) */}
              <div
                title="Echoes (Points Currency)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontFamily: 'var(--font-stat)',
                  fontSize: '1.2rem',
                  color: 'var(--color-echo-bright)',
                }}
              >
                <span>💎</span>
                <span>{character.echoes || 0}</span>
              </div>

              <div style={{ width: '1px', height: '14px', background: 'var(--color-border)' }} />

              {/* Grace Level */}
              <div
                title="Grace Level"
                style={{
                  fontFamily: 'var(--font-pixel)',
                  fontSize: '0.6rem',
                  color: 'var(--color-gold-bright)',
                  background: 'rgba(201, 168, 76, 0.15)',
                  padding: '2px 5px',
                  border: '1px solid var(--color-gold-dim)',
                }}
              >
                LVL {character.grace_level || 1}
              </div>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute 8-Bit Audio' : 'Mute Sound FX'}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-dim)',
              padding: '0.4rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>

          {/* Auth Button */}
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="pixel-btn"
              style={{
                fontSize: '0.6rem',
                padding: '0.4rem 0.7rem',
                background: '#2c1818',
                borderColor: '#5a2222',
                color: '#ffaaaa',
              }}
            >
              Exit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="pixel-btn" style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem' }}>
                Login
              </Link>
              <Link to="/register" className="pixel-btn pixel-btn-gold" style={{ fontSize: '0.65rem', padding: '0.4rem 0.8rem' }}>
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
