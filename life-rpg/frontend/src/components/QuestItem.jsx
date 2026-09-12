import React, { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sfx'

export const QuestItem = ({ quest, onQuestUpdated, onQuestDeleted }) => {
  const { soundMuted, fetchCharacter, triggerLevelUp } = useAuth()
  const { addToast } = useToast()
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleComplete = async () => {
    if (quest.is_completed || isCompleting) return
    setIsCompleting(true)
    playSound('quest_complete', soundMuted)

    try {
      const { data } = await api.post(`/quests/${quest.id}/complete`)
      
      addToast({
        title: 'Quest Conquered!',
        message: `+${data.runes_earned} Runes, +${data.echoes_earned} Echoes!`,
        type: 'runes',
      })

      if (data.leveled_up) {
        triggerLevelUp({
          oldLevel: (data.new_level || 2) - 1,
          newLevel: data.new_level,
        })
      }

      // Check newly awarded badges
      if (data.newly_awarded_badges?.length > 0) {
        data.newly_awarded_badges.forEach((bKey) => {
          addToast({
            title: 'Medallion Unlocked!',
            message: `You earned the "${bKey.replace(/_/g, ' ').toUpperCase()}" medallion!`,
            type: 'badge',
          })
        })
      }

      await fetchCharacter()
      onQuestUpdated({
        ...quest,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to complete quest',
        type: 'error',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    playSound('click', soundMuted)

    try {
      await api.delete(`/quests/${quest.id}`)
      addToast({
        title: 'Quest Banished',
        message: `"${quest.title}" removed from codex.`,
        type: 'info',
      })
      onQuestDeleted(quest.id)
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Error',
        message: err.response?.data?.detail || 'Failed to delete quest',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="pixel-panel"
      style={{
        padding: '0.9rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        opacity: quest.is_completed ? 0.65 : 1,
        borderLeft: quest.is_completed
          ? '4px solid var(--color-success)'
          : `4px solid var(--color-${quest.difficulty === 'legendary' ? 'gold' : quest.difficulty === 'challenging' ? 'echo' : 'border'})`,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Checkbox & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
        <button
          onClick={handleComplete}
          disabled={quest.is_completed || isCompleting}
          style={{
            width: '24px',
            height: '24px',
            background: quest.is_completed ? 'var(--color-success)' : 'rgba(0,0,0,0.5)',
            border: `2px solid ${quest.is_completed ? 'var(--color-success-bright)' : 'var(--color-border-bright)'}`,
            borderRadius: '2px',
            cursor: quest.is_completed ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.8rem',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
          title={quest.is_completed ? 'Completed' : 'Click to complete quest'}
        >
          {quest.is_completed ? '✓' : isCompleting ? '⌛' : ''}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            color: quest.is_completed ? 'var(--color-text-dim)' : 'var(--color-text)',
            textDecoration: quest.is_completed ? 'line-through' : 'none',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}>
            {quest.title}
          </div>

          {quest.description && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.15rem',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}>
              {quest.description}
            </div>
          )}
        </div>
      </div>

      {/* Rewards & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Date and Recurring Badges */}
        {quest.is_daily && (
          <span style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-pixel)',
            color: 'var(--color-gold)',
            background: 'rgba(201, 168, 76, 0.12)',
            border: '1px solid var(--color-gold-dim)',
            padding: '2px 5px',
          }}>
            🔁 DAILY
          </span>
        )}

        {quest.due_date && (() => {
          const today = new Date().toISOString().split('T')[0]
          const isOverdue = !quest.is_completed && quest.due_date < today
          const isToday = quest.due_date === today
          const d = new Date()
          d.setDate(d.getDate() + 1)
          const isTomorrow = quest.due_date === d.toISOString().split('T')[0]

          const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : isOverdue ? `Overdue: ${quest.due_date}` : `${quest.due_date}`
          const color = isOverdue ? '#ff7675' : isToday ? 'var(--color-gold-bright)' : 'var(--color-text-dim)'
          const bg = isOverdue ? 'rgba(231, 76, 60, 0.15)' : 'rgba(255, 255, 255, 0.05)'
          const borderColor = isOverdue ? '#e74c3c' : 'var(--color-border)'

          return (
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-title)',
              fontWeight: '600',
              color: color,
              background: bg,
              border: `1px solid ${borderColor}`,
              padding: '2px 6px',
            }}>
              {label}
            </span>
          )
        })()}

        {/* Difficulty Badge */}
        <span className={`difficulty-badge difficulty-${quest.difficulty}`}>
          {quest.difficulty}
        </span>

        {/* Reward pills */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          fontFamily: 'var(--font-stat)',
          fontSize: '1.05rem',
        }}>
          <span style={{ color: 'var(--color-rune)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
            +{quest.rune_reward} RUNES
          </span>
          <span style={{ color: 'var(--color-echo-bright)', display: 'flex', alignItems: 'center' }}>
            +{quest.echo_reward} 💎
          </span>
        </div>

        {/* Delete button */}
        {!quest.is_completed && (
          <button
            onClick={handleDelete}
            title="Banish Quest"
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: '0.2rem 0.4rem',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#e74c3c')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--color-text-muted)')}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
