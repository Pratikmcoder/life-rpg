import React, { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sfx'

const RARITY_COLORS = {
  common: '#bdc3c7',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f1c40f',
}

const ITEM_ICONS = {
  worn_shield: '🛡️',
  iron_sword: '🗡️',
  knights_helm: '🪖',
  chain_mail: '🥋',
  soldiers_ring: '💍',
  blessed_seal: '🧿',
  rune_talisman: '📿',
  berserker_blade: '⚔️',
  plate_armor: '🛡️',
  dragon_helm: '🐉',
  dragonseal_armor: '🥋',
  godslayer_sword: '⚡',
  ancient_bulwark: '🏛️',
  elden_medallion: '👑',
}

export const ShopPage = () => {
  const { character, fetchCharacter, soundMuted } = useAuth()
  const { addToast } = useToast()

  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'weapon' | 'armor' | 'accessory'
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingItemKey, setPurchasingItemKey] = useState(null)

  const loadShop = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/shop')
      setItems(data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadShop()
  }, [])

  const handlePurchase = async (item) => {
    if (item.is_sold_out) {
      addToast({
        title: 'Sold Out',
        message: `${item.name} is a unique relic and has already been acquired.`,
        type: 'error',
      })
      return
    }

    if (item.is_locked) {
      addToast({
        title: 'Item Locked',
        message: item.lock_reason || 'You have not unlocked this item yet.',
        type: 'error',
      })
      return
    }

    if ((character?.echoes || 0) < item.price_echoes) {
      addToast({
        title: 'Insufficient Echoes',
        message: `You need ${item.price_echoes} Echoes to acquire this.`,
        type: 'error',
      })
      return
    }

    setPurchasingItemKey(item.item_key)
    playSound('purchase', soundMuted)

    try {
      const itemIdToSend = item.id || item.item_id || item.item_key
      const { data } = await api.post('/shop/purchase', {
        item_id: itemIdToSend,
        quantity: 1,
      })

      addToast({
        title: 'Acquired Item!',
        message: `${item.name} has been added to your Pouch.`,
        type: 'echoes',
      })

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
      await loadShop()
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Purchase Failed',
        message: err.response?.data?.detail || 'Failed to complete transaction.',
        type: 'error',
      })
    } finally {
      setPurchasingItemKey(null)
    }
  }

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true
    if (activeTab === 'weapon') return item.type === 'weapon' || item.slot === 'weapon'
    if (activeTab === 'armor') return item.type === 'armor' || item.type === 'helmet' || item.slot === 'helmet' || item.slot === 'armor'
    if (activeTab === 'accessory') return item.type === 'accessory' || item.slot === 'accessory'
    return true
  })

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
            🏛️ MERCHANT'S VAULT
          </h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
            Exchange your earned Echoes for legendary weapons, armor, and medallions.
          </p>
        </div>

        {/* Echoes Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-echo-bright)',
          boxShadow: '0 0 10px var(--color-echo-glow)',
          padding: '0.6rem 1rem',
        }}>
          <span style={{ fontSize: '1.2rem' }}>💎</span>
          <div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-pixel)', color: 'var(--color-echo-bright)' }}>
              AVAILABLE ECHOES
            </div>
            <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.6rem', color: '#fff', lineHeight: 1 }}>
              {character?.echoes || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs (Consumables removed as requested) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Relics' },
          { id: 'weapon', label: '⚔️ Weapons' },
          { id: 'armor', label: '🛡️ Armor & Helmets' },
          { id: 'accessory', label: '📿 Accessories' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              playSound('click', soundMuted)
            }}
            className="pixel-btn"
            style={{
              fontSize: '0.7rem',
              padding: '0.5rem 0.9rem',
              background: activeTab === tab.id ? 'var(--color-surface-hover)' : 'transparent',
              borderColor: activeTab === tab.id ? 'var(--color-gold)' : 'var(--color-border)',
              color: activeTab === tab.id ? 'var(--color-gold-bright)' : 'var(--color-text-dim)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Browsing the Merchant's Wares...
        </div>
      ) : (
        <div className="grid-cols-3">
          {filteredItems.map((item) => {
            const isLocked = item.is_locked
            const isSoldOut = Boolean(item.is_sold_out)
            const canAfford = (character?.echoes || 0) >= item.price_echoes
            const rarityColor = RARITY_COLORS[item.rarity] || '#fff'
            const icon = ITEM_ICONS[item.item_key] || '📦'

            return (
              <div
                key={item.item_key}
                className="pixel-panel"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: isSoldOut ? 0.38 : isLocked ? 0.6 : 1,
                  filter: isSoldOut ? 'grayscale(0.75)' : 'none',
                  border: isSoldOut ? '2px dashed #7f1d1d' : isLocked ? '1px dashed var(--color-border)' : `2px solid ${rarityColor}`,
                  boxShadow: isSoldOut ? 'none' : isLocked ? 'none' : `0 0 10px ${rarityColor}33`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'opacity 0.2s ease, filter 0.2s ease',
                }}
              >
                {/* Sold Out Overlay Banner Across Card */}
                {isSoldOut && (
                  <div style={{
                    position: 'absolute',
                    top: '42%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-10deg)',
                    background: 'rgba(185, 28, 28, 0.95)',
                    border: '2px solid #f87171',
                    color: '#ffffff',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '1.05rem',
                    letterSpacing: '2px',
                    padding: '0.45rem 1.4rem',
                    boxShadow: '0 0 18px rgba(239, 68, 68, 0.7)',
                    zIndex: 10,
                    textShadow: '0 2px 4px #000',
                    pointerEvents: 'none',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    SOLD OUT
                  </div>
                )}

                {/* Status Badges in Top Right */}
                {isSoldOut ? (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(90, 20, 20, 0.9)',
                    border: '1px solid #e74c3c',
                    color: '#ff7675',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.55rem',
                    padding: '2px 6px',
                    zIndex: 5,
                  }}>
                    SOLD OUT
                  </div>
                ) : isLocked ? (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(90, 20, 20, 0.9)',
                    border: '1px solid #e74c3c',
                    color: '#ff7675',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.55rem',
                    padding: '2px 6px',
                  }}>
                    🔒 LOCKED
                  </div>
                ) : item.is_one_time ? (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(241, 196, 15, 0.15)',
                    border: '1px solid #f1c40f',
                    color: '#f1c40f',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.5rem',
                    padding: '2px 6px',
                  }}>
                    ⭐ UNIQUE
                  </div>
                ) : item.is_consumable ? (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'rgba(52, 152, 219, 0.15)',
                    border: '1px solid #3498db',
                    color: '#3498db',
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.5rem',
                    padding: '2px 6px',
                  }}>
                    1 BATTLE
                  </div>
                ) : null}

                {/* Top Item Info */}
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{
                      fontSize: '2rem',
                      width: '48px',
                      height: '48px',
                      background: 'rgba(0,0,0,0.5)',
                      border: `1px solid ${rarityColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {icon}
                    </div>

                    <div>
                      <div style={{
                        fontFamily: 'var(--font-title)',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: rarityColor,
                        marginBottom: '0.2rem',
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-pixel)',
                        fontSize: '0.55rem',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-dim)',
                      }}>
                        {item.rarity} {item.type}
                      </div>
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-dim)',
                    lineHeight: 1.4,
                    marginBottom: '1rem',
                  }}>
                    {item.description}
                  </p>

                  {/* Stat Bonuses */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {item.strength_bonus > 0 && (
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: '#f1c40f', background: 'rgba(241,196,15,0.1)', padding: '2px 6px', border: '1px solid #7a6530' }}>
                        +{item.strength_bonus} AP
                      </span>
                    )}
                    {item.poise_bonus > 0 && (
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: '#bdc3c7', background: 'rgba(189,195,199,0.1)', padding: '2px 6px', border: '1px solid #7f8c8d' }}>
                        +{item.poise_bonus} DEF
                      </span>
                    )}
                    {item.vigor_bonus > 0 && (
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: '#e74c3c', background: 'rgba(231,76,60,0.1)', padding: '2px 6px', border: '1px solid #8b1a1a' }}>
                        +{item.vigor_bonus} Base HP
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Purchase & Lock/Sold Out Reason */}
                <div>
                  {isSoldOut ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.4rem', color: 'var(--color-text-muted)' }}>
                        💎 {item.price_echoes}
                      </div>
                      <button
                        disabled
                        className="pixel-btn"
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.45rem 0.85rem',
                          background: 'rgba(50, 50, 50, 0.4)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-muted)',
                          cursor: 'not-allowed',
                        }}
                      >
                        Sold Out
                      </button>
                    </div>
                  ) : isLocked ? (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#e74c3c',
                      background: 'rgba(139,26,26,0.15)',
                      padding: '0.5rem',
                      border: '1px solid #631919',
                      textAlign: 'center',
                    }}>
                      ⚠️ {item.lock_reason}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontFamily: 'var(--font-stat)', fontSize: '1.4rem', color: 'var(--color-echo-bright)' }}>
                        💎 {item.price_echoes}
                      </div>

                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={purchasingItemKey === item.item_key || !canAfford}
                        className="pixel-btn pixel-btn-echo"
                        style={{ fontSize: '0.65rem', padding: '0.45rem 0.85rem' }}
                      >
                        {purchasingItemKey === item.item_key ? 'Buying...' : canAfford ? 'Acquire' : 'Need Echoes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
