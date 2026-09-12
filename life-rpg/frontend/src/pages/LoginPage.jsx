import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (authLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      addToast({
        title: 'Welcome Back',
        message: 'Your Grace rekindles, Tarnished.',
        type: 'success',
      })
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Authentication Failed',
        message: err.response?.data?.detail || 'Invalid email or password',
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
            RETURN, TARNISHED
          </h1>
          <p style={{ fontFamily: 'var(--font-title)', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
            Enter the Lands Between and resume your trials.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
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
              Password
            </label>
            <input
              type="password"
              required
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
            {isLoading ? 'Rekindling Grace...' : 'Enter Lands Between'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          New to the Realm?{' '}
          <Link to="/register" style={{ color: 'var(--color-gold)', textDecoration: 'none', fontWeight: 'bold' }}>
            Begin Journey
          </Link>
        </div>
      </div>
    </div>
  )
}
