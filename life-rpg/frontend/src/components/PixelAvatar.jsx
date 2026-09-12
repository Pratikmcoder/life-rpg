import React from 'react'

export const PixelAvatar = ({ size = 64, level = 1, className = '' }) => {
  // Pixel art Tarnished hero rendering in SVG
  const auraGlow = level >= 10 ? 'rgba(241, 196, 15, 0.4)' : level >= 5 ? 'rgba(155, 89, 182, 0.3)' : 'transparent'

  return (
    <div
      className={`pixel-avatar-wrapper ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0e0f17',
        border: '2px solid var(--color-border-gold)',
        boxShadow: `0 0 10px ${auraGlow}, inset 0 0 8px rgba(0,0,0,0.8)`,
        imageRendering: 'pixelated',
      }}
    >
      <svg
        viewBox="0 0 16 16"
        width="85%"
        height="85%"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Cloak / Hood Outline */}
        <rect x="5" y="2" width="6" height="2" fill="#2d2218" />
        <rect x="4" y="3" width="8" height="6" fill="#3d3023" />
        
        {/* Face / Mask */}
        <rect x="6" y="5" width="4" height="4" fill="#8c7b6c" />
        {/* Glowing Eyes */}
        <rect x="6" y="6" width="1" height="1" fill="#f1c40f" />
        <rect x="9" y="6" width="1" height="1" fill="#f1c40f" />

        {/* Armor / Torso */}
        <rect x="5" y="9" width="6" height="4" fill="#525266" />
        <rect x="6" y="9" width="4" height="3" fill="#6d6d85" />
        {/* Gold Inscription on chest */}
        <rect x="7" y="10" width="2" height="1" fill="#c9a84c" />

        {/* Arms / Shoulders */}
        <rect x="3" y="9" width="2" height="4" fill="#3a3a4d" />
        <rect x="11" y="9" width="2" height="4" fill="#3a3a4d" />

        {/* Sword in hand */}
        <rect x="13" y="6" width="1" height="7" fill="#b0b0c0" />
        <rect x="12" y="8" width="3" height="1" fill="#c9a84c" />
        <rect x="13" y="13" width="1" height="1" fill="#4a3b2c" />

        {/* Legs / Greaves */}
        <rect x="5" y="13" width="2" height="3" fill="#2a2a36" />
        <rect x="9" y="13" width="2" height="3" fill="#2a2a36" />
      </svg>
      {level > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            background: 'var(--color-gold)',
            color: '#000',
            fontFamily: 'var(--font-pixel)',
            fontSize: '0.5rem',
            padding: '1px 3px',
            fontWeight: 'bold',
            border: '1px solid #000',
          }}
        >
          {level}
        </div>
      )}
    </div>
  )
}
