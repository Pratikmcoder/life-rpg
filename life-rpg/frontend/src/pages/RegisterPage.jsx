import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export const RegisterPage = () => {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (authLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      addToast({
        title: 'Weak Password',
        message: 'Password must be at least 8 characters long.',
        type: 'error',
      })
      return
    }
    if (!/\d/.test(password)) {
      addToast({
        title: 'Weak Password',
        message: 'Password must contain at least one number.',
        type: 'error',
      })
      return
    }

    setIsLoading(true)

    try {
      await register(username, email, password)
      addToast({
        title: 'Grace Awakened',
        message: `Welcome, ${username}! Starter gear added to your pouch.`,
        type: 'success',
      })
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      let errorMessage = 'Failed to create account'
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        errorMessage = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail[0].msg.replace('Value error, ', '')
      }

      addToast({
        title: 'Registration Failed',
        message: errorMessage,
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div
        className="pixel-panel-gold"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2rem',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img src="/flame.svg" alt="Flame" style={{ width: '42px', height: '42px', marginBottom: '0.75rem' }} className="flame-flicker" />
          <h1 style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1rem',
            color: 'var(--color-gold-bright)',
            marginBottom: '0.4rem',
          }}>
            BECOME TARNISHED
          </h1>
          <p style={{ fontFamily: 'var(--font-title)', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
            Awaken your character, receive starter gear, and reclaim the Elden Ring.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.4rem' }}>
              Tarnished Name (Username)
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={20}
              placeholder="e.g., GodrickHunter"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="tarnished@landsbetween.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.4rem' }}>
              Password (Min 8 Characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="pixel-btn pixel-btn-gold"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.8rem', marginBottom: '1.25rem' }}
          >
            {isLoading ? 'Forging Character...' : 'Begin Your Journey'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Already have a character?{' '}
          <Link to="/login" style={{ color: 'var(--color-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
            Return to Realm
          </Link>
        </div>
      </div>
    </div>
  )
}
