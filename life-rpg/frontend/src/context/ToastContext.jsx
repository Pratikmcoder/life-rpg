import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => {
          let borderColor = 'var(--color-border)'
          let glowColor = 'transparent'
          let icon = '⚔️'

          if (toast.type === 'success' || toast.type === 'runes') {
            borderColor = 'var(--color-gold-bright)'
            glowColor = 'var(--color-gold-glow)'
            icon = '✨'
          } else if (toast.type === 'error' || toast.type === 'defeat') {
            borderColor = 'var(--color-crimson-bright)'
            glowColor = 'var(--color-crimson-glow)'
            icon = '💀'
          } else if (toast.type === 'echoes') {
            borderColor = 'var(--color-echo-bright)'
            glowColor = 'var(--color-echo-glow)'
            icon = '💎'
          } else if (toast.type === 'badge') {
            borderColor = 'var(--color-arcane-bright)'
            glowColor = 'var(--color-arcane-glow)'
            icon = '🏅'
          }

          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(18, 19, 28, 0.95)',
                border: `2px solid ${borderColor}`,
                boxShadow: `0 4px 16px rgba(0,0,0,0.8), 0 0 12px ${glowColor}`,
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                animation: 'slideIn 0.25s ease-out',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1 }}>
                {toast.title && (
                  <div style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.7rem',
                    color: borderColor,
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                  }}>
                    {toast.title}
                  </div>
                )}
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text)',
                  lineHeight: 1.3,
                }}>
                  {toast.message}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
