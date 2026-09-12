import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CharacterCard } from '../components/CharacterCard'
import { QuestItem } from '../components/QuestItem'
import { CreateQuestModal } from '../components/CreateQuestModal'

export const DashboardPage = () => {
  const { character } = useAuth()
  const [quests, setQuests] = useState([])
  const [nextBoss, setNextBoss] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load active quests
      const [questsRes, mapRes] = await Promise.all([
        api.get('/quests?status=active'),
        api.get('/map'),
      ])
      setQuests(questsRes.data.quests || [])

      // Find first undefeated unlocked boss
      const bosses = mapRes.data.bosses || []
      const availableBoss = bosses.find((b) => b.is_unlocked && !b.is_defeated) || bosses[0]
      setNextBoss(availableBoss)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleQuestCreated = (newQuest) => {
    setQuests((prev) => [newQuest, ...prev])
  }

  const handleQuestUpdated = (updatedQuest) => {
    setQuests((prev) => prev.filter((q) => q.id !== updatedQuest.id))
  }

  const handleQuestDeleted = (questId) => {
    setQuests((prev) => prev.filter((q) => q.id !== questId))
  }

  return (
    <div className="app-container">
      {/* Welcome Banner */}
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
            fontSize: '1.1rem',
            color: 'var(--color-gold-bright)',
            marginBottom: '0.25rem',
          }}>
            WELCOME, {character?.name || 'TARNISHED'}
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="pixel-btn pixel-btn-gold"
          style={{ fontSize: '0.75rem', padding: '0.7rem 1.2rem' }}
        >
          + Inscribe New Quest
        </button>
      </div>

      {/* Main Grid: Sidebar Stats + Dashboard Feed */}
      <div className="grid-cols-1-2">
        {/* Left: Character Stats Card */}
        <aside>
          <CharacterCard stretch={true} />
        </aside>

        {/* Right: Quests & Boss Encounter */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Boss Encounter Banner */}
          {nextBoss && (
            <div
              className="pixel-panel-gold"
              style={{
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                background: 'linear-gradient(90deg, rgba(91, 45, 142, 0.25) 0%, rgba(23, 24, 36, 0.9) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  fontSize: '2rem',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '0.5rem',
                  border: '1px solid var(--color-arcane)',
                }}>
                  👹
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.65rem',
                    color: 'var(--color-arcane-bright)',
                    marginBottom: '0.2rem',
                  }}>
                    {nextBoss.is_defeated ? 'TRIAL CONQUERED' : 'ACTIVE TRIAL OF THE DEMIGOD'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-title)',
                    fontSize: '1.2rem',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}>
                    {nextBoss.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                    Boss Stats: {nextBoss.hp} HP / {nextBoss.ap} AP / {nextBoss.defense} DEF
                  </div>
                </div>
              </div>

              <Link
                to={`/boss/${nextBoss.id || nextBoss.boss_key}`}
                className="pixel-btn pixel-btn-crimson"
                style={{ fontSize: '0.75rem', padding: '0.65rem 1.1rem' }}
              >
                Enter Arena
              </Link>
            </div>
          )}

          {/* Today's Active Quests */}
          <div className="pixel-panel" style={{ padding: '1.25rem', flexGrow: 1 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-title)',
                fontSize: '1.1rem',
                color: 'var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>📜</span>
                <span>Active Quests ({quests.length})</span>
              </h2>
              <Link
                to="/quests"
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-dim)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-title)',
                }}
              >
                View All Quests ➔
              </Link>
            </div>

            {isLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Consulting the Codex...
              </div>
            ) : quests.length === 0 ? (
              <div style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                border: '1px dashed var(--color-border)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', color: '#fff', marginBottom: '0.25rem' }}>
                  No Active Quests Inscribed
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="pixel-btn pixel-btn-gold"
                  style={{ fontSize: '0.75rem' }}
                >
                  + Inscribe First Quest
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {quests.map((q) => (
                  <QuestItem
                    key={q.id}
                    quest={q}
                    onQuestUpdated={handleQuestUpdated}
                    onQuestDeleted={handleQuestDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Inscribe Quest Modal */}
      <CreateQuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onQuestCreated={handleQuestCreated}
      />
    </div>
  )
}
