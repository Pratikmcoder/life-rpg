import React, { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sfx'

const DIFFICULTY_CONFIG = {
  trivial: { label: 'Trivial', runes: 25, echoes: 5, color: '#bdc3c7', desc: 'Quick 2-minute habit or chore' },
  common: { label: 'Common', runes: 75, echoes: 15, color: '#2ecc71', desc: 'Standard task (15–30 mins)' },
  challenging: { label: 'Challenging', runes: 150, echoes: 30, color: '#3498db', desc: 'High effort or deep focus (1–2 hrs)' },
  legendary: { label: 'Legendary', runes: 300, echoes: 60, color: '#f1c40f', desc: 'Major project milestone / extreme focus' },
}

export const CreateQuestModal = ({ isOpen, onClose, onQuestCreated }) => {
  const { soundMuted } = useAuth()
  const { addToast } = useToast()

  const getTodayStr = () => new Date().toISOString().split('T')[0]

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('common')
  const [isDaily, setIsDaily] = useState(false)
  const [dueDate, setDueDate] = useState(getTodayStr())
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty,
        is_daily: isDaily,
        due_date: dueDate || undefined,
      }
      const { data } = await api.post('/quests', payload)
      playSound('click', soundMuted)
      addToast({
        title: 'Quest Inscribed',
        message: `"${title.trim()}" added to your codex for ${dueDate || 'today'}.`,
        type: 'info',
      })
      onQuestCreated(data)
      // reset form
      setTitle('')
      setDescription('')
      setDifficulty('common')
      setIsDaily(false)
      setDueDate(getTodayStr())
      onClose()
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to create quest',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        backgroundColor: 'rgba(5, 6, 12, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="pixel-panel"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '1.75rem',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border-gold)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', color: 'var(--color-gold-bright)' }}>
            Inscribe New Quest
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-dim)',
              fontSize: '1.2rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
              Quest Title *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g., Slay the morning algorithm problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
              Lore / Description (Optional)
            </label>
            <textarea
              maxLength={500}
              rows={2}
              placeholder="Optional context, steps, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Difficulty Picker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>
              Trial Difficulty & Rewards
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => {
                const isSelected = difficulty === key
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setDifficulty(key)
                      playSound('click', soundMuted)
                    }}
                    style={{
                      border: `2px solid ${isSelected ? cfg.color : 'var(--color-border)'}`,
                      background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'var(--color-bg)',
                      padding: '0.65rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '0.65rem',
                        color: cfg.color,
                        textTransform: 'uppercase',
                      }}>
                        {cfg.label}
                      </span>
                      <div style={{ fontFamily: 'var(--font-stat)', fontSize: '0.75rem', color: 'var(--color-rune)' }}>
                        +{cfg.runes} RUNES / +{cfg.echoes} 💎
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {cfg.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Options: Daily & Due Date */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                📅 Quest Date / Due Date *
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setDueDate(getTodayStr())}
                  className="pixel-btn"
                  style={{ fontSize: '0.55rem', padding: '2px 6px' }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + 1)
                    setDueDate(d.toISOString().split('T')[0])
                  }}
                  className="pixel-btn"
                  style={{ fontSize: '0.55rem', padding: '2px 6px' }}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.85rem',
                }}
              />

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--color-text)',
              }}>
                <input
                  type="checkbox"
                  checked={isDaily}
                  onChange={(e) => setIsDaily(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }}
                />
                <span>🔁 Recurring Daily</span>
              </label>
            </div>
          </div>

          {/* Reward Summary Pill */}
          <div style={{
            background: 'rgba(201, 168, 76, 0.08)',
            border: '1px solid var(--color-gold-dim)',
            padding: '0.6rem 0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
          }}>
            <span style={{ color: 'var(--color-text-dim)' }}>Completion Spoils:</span>
            <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-stat)', fontSize: '1.2rem' }}>
              <span style={{ color: 'var(--color-gold-bright)' }}>
                ✨ {DIFFICULTY_CONFIG[difficulty].runes} Runes
              </span>
              <span style={{ color: 'var(--color-echo-bright)' }}>
                💎 {DIFFICULTY_CONFIG[difficulty].echoes} Echoes
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn"
              style={{ fontSize: '0.7rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="pixel-btn pixel-btn-gold"
              style={{ fontSize: '0.7rem' }}
            >
              {isSubmitting ? 'Inscribing...' : 'Inscribe Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
