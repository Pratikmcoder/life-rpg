import React, { useState, useEffect, useMemo } from 'react'
import api from '../api/client'
import { QuestItem } from '../components/QuestItem'
import { CreateQuestModal } from '../components/CreateQuestModal'
import { playSound } from '../utils/sfx'
import { useAuth } from '../context/AuthContext'

export const QuestsPage = () => {
  const { soundMuted } = useAuth()
  const [quests, setQuests] = useState([])
  const [filterTab, setFilterTab] = useState('all') // 'active' | 'completed' | 'all'
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'tomorrow' | 'upcoming' | 'overdue'
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadQuests = async () => {
    setIsLoading(true)
    try {
      const url = filterTab === 'all' ? '/quests' : `/quests?status=${filterTab}`
      const { data } = await api.get(url)
      setQuests(data.quests || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuests()
  }, [filterTab])

  const handleQuestCreated = (newQuest) => {
    setQuests((prev) => [newQuest, ...prev])
  }

  const handleQuestUpdated = (updatedQuest) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === updatedQuest.id ? updatedQuest : q))
    )
  }

  const handleQuestDeleted = (questId) => {
    setQuests((prev) => prev.filter((q) => q.id !== questId))
  }

  // Date calculation helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const tomorrowStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }, [])

  // Filter quests
  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDifficulty =
        difficultyFilter === 'all' || q.difficulty === difficultyFilter

      let matchesDate = true
      if (dateFilter === 'today') {
        matchesDate = q.due_date === todayStr || (q.is_daily && !q.is_completed)
      } else if (dateFilter === 'tomorrow') {
        matchesDate = q.due_date === tomorrowStr
      } else if (dateFilter === 'upcoming') {
        matchesDate = q.due_date && q.due_date > tomorrowStr
      } else if (dateFilter === 'overdue') {
        matchesDate = !q.is_completed && q.due_date && q.due_date < todayStr
      }

      return matchesSearch && matchesDifficulty && matchesDate
    })
  }, [quests, searchQuery, difficultyFilter, dateFilter, todayStr, tomorrowStr])

  // Group filtered quests date-wise
  const groupedQuests = useMemo(() => {
    const overdue = []
    const today = []
    const tomorrow = []
    const upcomingByDate = {} // dateStr -> [quests]
    const undated = []
    const completed = []

    filteredQuests.forEach((q) => {
      if (q.is_completed) {
        completed.push(q)
        return
      }

      if (!q.due_date) {
        undated.push(q)
      } else if (q.due_date < todayStr) {
        overdue.push(q)
      } else if (q.due_date === todayStr) {
        today.push(q)
      } else if (q.due_date === tomorrowStr) {
        tomorrow.push(q)
      } else {
        if (!upcomingByDate[q.due_date]) {
          upcomingByDate[q.due_date] = []
        }
        upcomingByDate[q.due_date].push(q)
      }
    })

    // Sort upcoming dates chronologically
    const sortedUpcomingDates = Object.keys(upcomingByDate).sort()

    return {
      overdue,
      today,
      tomorrow,
      sortedUpcomingDates,
      upcomingByDate,
      undated,
      completed,
    }
  }, [filteredQuests, todayStr, tomorrowStr])

  const formatDateDisplay = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-')
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const renderSection = (title, items, icon, color = 'var(--color-gold)', badge = null, borderColor = 'var(--color-border)') => {
    if (!items || items.length === 0) return null

    return (
      <div style={{ marginBottom: '1.75rem' }}>
        {/* Section Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0.85rem',
          background: 'rgba(23, 24, 36, 0.95)',
          borderLeft: `4px solid ${color}`,
          borderTop: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          marginBottom: '0.6rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{icon}</span>
            <span style={{
              fontFamily: 'var(--font-title)',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              color: color,
              letterSpacing: '0.5px',
            }}>
              {title}
            </span>
            {badge && (
              <span style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-pixel)',
                background: 'rgba(231, 76, 60, 0.2)',
                border: '1px solid #e74c3c',
                color: '#ff7675',
                padding: '2px 5px',
              }}>
                {badge}
              </span>
            )}
          </div>

          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-stat)',
            color: 'var(--color-text-dim)',
            background: 'var(--color-surface-2)',
            padding: '2px 8px',
            borderRadius: '2px',
          }}>
            {items.length} {items.length === 1 ? 'Quest' : 'Quests'}
          </span>
        </div>

        {/* Quests in Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((q) => (
            <QuestItem
              key={q.id}
              quest={q}
              onQuestUpdated={handleQuestUpdated}
              onQuestDeleted={handleQuestDeleted}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-pixel)',
            fontSize: '1.2rem',
            color: 'var(--color-gold-bright)',
            marginBottom: '0.25rem',
          }}>
            QUEST & HABIT CODEX
          </h1>
        </div>

        <button
          onClick={() => { playSound('click', soundMuted); setIsModalOpen(true); }}
          className="pixel-btn pixel-btn-gold"
          style={{ fontSize: '0.75rem', padding: '0.7rem 1.2rem' }}
        >
          + Inscribe New Quest
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="pixel-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Top Row: Date Group Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'overdue', label: 'Overdue' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { playSound('click', soundMuted); setDateFilter(tab.id); }}
                  className="pixel-btn"
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.4rem 0.75rem',
                    background: dateFilter === tab.id ? 'var(--color-surface-hover)' : 'transparent',
                    borderColor: dateFilter === tab.id ? 'var(--color-gold)' : 'var(--color-border)',
                    color: dateFilter === tab.id ? 'var(--color-gold-bright)' : 'var(--color-text-dim)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {['all', 'active', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { playSound('click', soundMuted); setFilterTab(tab); }}
                  className="pixel-btn"
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.4rem 0.75rem',
                    background: filterTab === tab ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                    borderColor: filterTab === tab ? 'var(--color-gold-dim)' : 'var(--color-border)',
                    color: filterTab === tab ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Search & Difficulty */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <input
              type="text"
              placeholder="Search quest inscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
                flex: 1,
                minWidth: '200px',
              }}
            />

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="trivial">Trivial</option>
              <option value="common">Common</option>
              <option value="challenging">Challenging</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date-Wise Categorized Quest Sections */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Reading Ancient Inscriptions...
        </div>
      ) : filteredQuests.length === 0 ? (
        <div className="pixel-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>📖</div>
          <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-gold)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            No Quests Found
          </h3>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Your codex is empty for this filter.
          </p>
          <button onClick={() => { playSound('click', soundMuted); setIsModalOpen(true); }} className="pixel-btn pixel-btn-gold" style={{ fontSize: '0.75rem' }}>
            Inscribe A Quest
          </button>
        </div>
      ) : (
        <div>
          {/* 1. Overdue Section */}
          {renderSection(
            'Overdue Trials',
            groupedQuests.overdue,
            '⚠️',
            '#e74c3c',
            'OVERDUE',
            '#5a2222'
          )}

          {/* 2. Today Section */}
          {renderSection(
            `Today's Inscriptions — ${formatDateDisplay(todayStr)}`,
            groupedQuests.today,
            '⚔️',
            'var(--color-gold-bright)',
            null,
            'var(--color-border-gold)'
          )}

          {/* 3. Tomorrow Section */}
          {renderSection(
            `Tomorrow's Inscriptions — ${formatDateDisplay(tomorrowStr)}`,
            groupedQuests.tomorrow,
            '⏳',
            'var(--color-echo-bright)',
            null,
            'var(--color-border-bright)'
          )}

          {/* 4. Upcoming Specific Dates */}
          {groupedQuests.sortedUpcomingDates.map((dateKey) =>
            renderSection(
              `Upcoming: ${formatDateDisplay(dateKey)}`,
              groupedQuests.upcomingByDate[dateKey],
              '📅',
              '#3498db',
              null,
              'var(--color-border)'
            )
          )}

          {/* 5. Undated / Evergreen Habits */}
          {renderSection(
            'Evergreen & General Habits',
            groupedQuests.undated,
            '📜',
            '#bdc3c7',
            null,
            'var(--color-border)'
          )}

          {/* 6. Completed Quests (if filterTab is 'completed' or 'all') */}
          {filterTab !== 'active' &&
            renderSection(
              'Conquered Quests Archive',
              groupedQuests.completed,
              '👑',
              'var(--color-success-bright)',
              'DONE',
              '#1e4620'
            )}
        </div>
      )}

      {/* Inscribe Quest Modal */}
      <CreateQuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onQuestCreated={handleQuestCreated}
      />
    </div>
  )
}
