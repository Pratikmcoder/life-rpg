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
      <img 
        src="/player_avatar.png" 
        alt="Player Avatar" 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
      />
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
