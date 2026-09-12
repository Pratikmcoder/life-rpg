import React, { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sfx'

export const SettingsPage = () => {
  const { user, character, fetchCharacter, soundMuted, toggleSound } = useAuth()
  const { addToast } = useToast()

  const [charName, setCharName] = useState(character?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isChangingPass, setIsChangingPass] = useState(false)

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!charName.trim()) return

    setIsUpdatingName(true)
    try {
      await api.patch('/character', { name: charName.trim() })
      playSound('click', soundMuted)
      addToast({
        title: 'Codex Updated',
        message: 'Tarnished name changed successfully.',
        type: 'success',
      })
      await fetchCharacter()
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to update name.',
        type: 'error',
      })
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      addToast({
        title: 'Error',
        message: 'New password must be at least 8 characters.',
        type: 'error',
      })
      return
    }

    setIsChangingPass(true)
    try {
      await api.patch('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      playSound('click', soundMuted)
      addToast({
        title: 'Password Sealed',
        message: 'Your password was changed successfully.',
        type: 'success',
      })
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Password Change Failed',
        message: err.response?.data?.detail || 'Current password incorrect.',
        type: 'error',
      })
    } finally {
      setIsChangingPass(false)
    }
  }

  return (
    <div className="app-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '1.2rem',
          color: 'var(--color-gold-bright)',
          marginBottom: '0.25rem',
        }}>
          SANCTUARY SETTINGS
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Character Profile Section */}
        <div className="pixel-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
            👑 Tarnished Identity
          </h2>

          <form onSubmit={handleUpdateName}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                Character Name
              </label>
              <input
                type="text"
                maxLength={24}
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
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
              disabled={isUpdatingName}
              className="pixel-btn pixel-btn-gold"
              style={{ fontSize: '0.7rem' }}
            >
              {isUpdatingName ? 'Updating...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Audio & Sound Preferences */}
        <div className="pixel-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
            🔊 Sound FX & Audio
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>8-Bit Retro Synthesizer SFX</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                Plays combat strikes, quest completions, level-up fanfares, and coin clinks.
              </div>
            </div>

            <button
              onClick={toggleSound}
              className="pixel-btn"
              style={{
                fontSize: '0.7rem',
                borderColor: soundMuted ? '#e74c3c' : 'var(--color-success)',
                color: soundMuted ? '#ff7675' : 'var(--color-success-bright)',
              }}
            >
              {soundMuted ? '🔇 Audio Muted' : '🔊 Audio Active'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="pixel-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', color: 'var(--color-gold)', marginBottom: '1rem' }}>
            🛡️ Seal Password
          </h2>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                New Password (Min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
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
              disabled={isChangingPass}
              className="pixel-btn"
              style={{ fontSize: '0.7rem' }}
            >
              {isChangingPass ? 'Sealing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
