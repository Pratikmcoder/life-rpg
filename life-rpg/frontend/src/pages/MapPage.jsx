import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { playSound } from '../utils/sfx'

/*
 * Boss icon positions mapped to the generated dark fantasy map background.
 * Values are percentages of the image dimensions.
 *
 * Map layout (from the generated image):
 *   - Gravekeeper:       bottom-left graveyard area
 *   - Shadow Warden:     left-center dark forest with banner
 *   - Queen of Ash:      center-bottom volcanic ruins
 *   - Void Sovereign:    upper-center dragon cave
 *   - Eternal Sovereign: top-right dark throne with lightning
 */
const BOSS_POSITIONS = {
  gravekeeper:       { x: 20,  y: 78 },
  shadow_warden:     { x: 25,  y: 30 },
  queen_of_ash:      { x: 58,  y: 80 },
  void_sovereign:    { x: 52,  y: 28 },
  eternal_sovereign: { x: 82,  y: 22 },
}

/* Horror-themed icons per boss — dark skull/symbol style */
const BOSS_ICONS = {
  gravekeeper:       '/gravekeeper.png',
  shadow_warden:     '/shadow_warden.png',
  queen_of_ash:      '/queen_of_ash.png',
  void_sovereign:    '/void_sovereign.png',
  eternal_sovereign: '/eternal_sovereign.png',
}

export const MapPage = () => {
  const { soundMuted } = useAuth()
  const navigate = useNavigate()

  const [bosses, setBosses] = useState([])
  const [activeBoss, setActiveBoss] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setIsLoading(true)
      try {
        const { data } = await api.get('/map')
        setBosses(data.bosses || [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const openModal  = (boss) => { playSound('click', soundMuted); setActiveBoss(boss) }
  const closeModal = ()     => { playSound('click', soundMuted); setActiveBoss(null) }
  const enterArena = (boss) => { playSound('click', soundMuted); navigate(`/boss/${boss.id || boss.boss_key}`) }

  return (
    <div className="map-page">
      {/* Background image fills entire viewport */}
      <img
        src="/map-bg.jpg"
        alt="The Lands Between — World Map"
        className="map-bg"
        draggable={false}
      />

      {/* Boss Pin Overlays */}
      {!isLoading && bosses.map((boss) => {
        const pos = BOSS_POSITIONS[boss.boss_key]
        if (!pos) return null

        const icon = BOSS_ICONS[boss.boss_key] || '⚔️'
        const defeated  = boss.is_defeated
        const unlocked  = boss.is_unlocked

        const stateClass = defeated ? 'defeated' : unlocked ? 'unlocked' : 'locked'

        return (
          <button
            key={boss.boss_key}
            className={`map-pin ${stateClass}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => openModal(boss)}
            aria-label={`${boss.name} — ${defeated ? 'Defeated' : unlocked ? 'Available' : 'Locked'}`}
          >
            <span className="map-pin__icon">
              {icon.endsWith('.png') ? (
                <img src={icon} alt={boss.name} style={{ width: '64px', height: '64px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.8))' }} />
              ) : (
                icon
              )}
            </span>
            <span className="map-pin__badge">
              {defeated ? '✓' : unlocked ? '!' : '🔒'}
            </span>
            <span className="map-pin__name">{boss.name}</span>
          </button>
        )
      })}

      {/* Boss Detail Modal */}
      {activeBoss && (
        <div className="map-modal-backdrop" onClick={closeModal}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <button className="map-modal__close" onClick={closeModal} aria-label="Close">✕</button>

            {/* Status */}
            <div className={`map-modal__status ${
              activeBoss.is_defeated ? 'status--defeated' :
              activeBoss.is_unlocked ? 'status--unlocked' : 'status--locked'
            }`}>
              {activeBoss.is_defeated
                ? '💀 DEMIGOD VANQUISHED'
                : activeBoss.is_unlocked
                ? 'TRIAL AWAITS'
                : '🔒 SEALED'}
            </div>

            {/* Name */}
            <h2 className="map-modal__name">{activeBoss.name}</h2>

            {/* Lore */}
            <blockquote className="map-modal__lore">
              "{activeBoss.lore}"
            </blockquote>

            {/* Stats Grid */}
            <div className="map-modal__stats">
              <div className="stat stat--hp">
                <div className="stat__label">HP</div>
                <div className="stat__value">{activeBoss.hp}</div>
              </div>
              <div className="stat stat--ap">
                <div className="stat__label">AP</div>
                <div className="stat__value">{activeBoss.ap}</div>
              </div>
              <div className="stat stat--def">
                <div className="stat__label">DEF</div>
                <div className="stat__value">{activeBoss.defense}</div>
              </div>
            </div>

            {/* Rewards */}
            <div className="map-modal__rewards">
              <div className="rewards__title">
                SPOILS {activeBoss.is_defeated && <span className="rewards__claimed">(CLAIMED)</span>}
              </div>
              <div className="rewards__values">
                <span className="reward reward--runes">+{activeBoss.rewards?.runes || 0} Runes</span>
                <span className="reward reward--echoes">+{activeBoss.rewards?.echoes || 0} Echoes</span>
              </div>
              {activeBoss.rewards?.items?.length > 0 && (
                <div className="rewards__drops">
                  Drops: {activeBoss.rewards.items.map((i) => i.item_key.replace(/_/g, ' ')).join(', ')}
                </div>
              )}
            </div>

            {/* CTA */}
            {activeBoss.is_unlocked ? (
              <button
                className="pixel-btn pixel-btn-crimson map-modal__cta"
                onClick={() => enterArena(activeBoss)}
              >
                ENTER THE ARENA
              </button>
            ) : (
              <div className="map-modal__locked">
                🔒 {activeBoss.unlock_requirement?.type === 'grace_level'
                  ? `Reach Grace Level ${activeBoss.unlock_requirement.value}`
                  : `Defeat ${(activeBoss.unlock_requirement?.value || '').replace(/_/g, ' ')}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
