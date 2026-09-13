import React, { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { playSound } from '../utils/sfx'
import { CharacterCard } from '../components/CharacterCard'

const RARITY_COLORS = {
  common: '#bdc3c7',
  uncommon: '#2ecc71',
  rare: '#3498db',
  legendary: '#f1c40f',
}

const ITEM_ICONS = {
  worn_shield: '/worn_shield.jpg',
  iron_sword: '/iron_sword.png',
  knights_helm: '/knights_helm.png',
  chain_mail: '/chain_mail.png',
  soldiers_ring: '/soldiers_ring.png',
  blessed_seal: '/blessed_seal.png',
  rune_talisman: '/rune_talisman.png',
  berserker_blade: '/berserker_blade.png',
  plate_armor: '/plate_armor.jpg',
  dragon_helm: '/dragon_helm.png',
  dragonseal_armor: '/dragonseal_armor.jpg',
  godslayer_sword: '/godslayer_sword.png',
  ancient_bulwark: '/ancient_bulwark.png',
  elden_medallion: '/elden_medallion.jpg',
}

const SLOT_ICONS = {
  weapon: '🗡️',
  helmet: '🪖',
  armor: '🥋',
  accessory: '📿',
}

export const InventoryPage = () => {
  const { fetchCharacter, soundMuted } = useAuth()
  const { addToast } = useToast()

  const [inventory, setInventory] = useState([])
  const [equipped, setEquipped] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState(false)

  const loadInventory = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/inventory')
      setInventory(data.items || [])
      setEquipped(data.equipped || {})
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const handleEquip = async (item) => {
    setActionInProgress(true)
    playSound('click', soundMuted)

    try {
      const slot = item.slot || (item.type === 'weapon' ? 'weapon' : item.type === 'helmet' ? 'helmet' : item.type === 'armor' ? 'armor' : 'accessory')
      const itemIdToSend = item.item_id || item.id || item.item_key
      await api.post('/inventory/equip', {
        item_id: itemIdToSend,
        slot,
      })

      addToast({
        title: 'Equipped',
        message: `Equipped ${item.name} into ${slot.toUpperCase()} slot.`,
        type: 'success',
      })

      await fetchCharacter()
      await loadInventory()
    } catch (err) {
      console.error(err)
      addToast({
        title: 'Equip Failed',
        message: err.response?.data?.detail || 'Failed to equip item.',
        type: 'error',
      })
    } finally {
      setActionInProgress(false)
    }
  }

  const handleUnequip = async (slot) => {
    setActionInProgress(true)
    playSound('click', soundMuted)

    try {
      await api.post('/inventory/unequip', { slot })
      addToast({
        title: 'Unequipped',
        message: `Cleared ${slot.toUpperCase()} slot.`,
        type: 'info',
      })
      await fetchCharacter()
      await loadInventory()
    } catch (err) {
      console.error(err)
    } finally {
      setActionInProgress(false)
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '1.2rem',
          color: 'var(--color-gold-bright)',
          marginBottom: '0.25rem',
        }}>
          TARNISHED POUCH & LOADOUT
        </h1>
      </div>

      {/* Top Section: Character & Active Loadout */}
      <div className="grid-cols-1-2" style={{ marginBottom: '1.5rem', alignItems: 'stretch' }}>
        <CharacterCard hideStreak={true} stretch={true} />

        {/* Right: Active Equipment Loadout */}
        <div className="pixel-panel-gold" style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-title)',
                fontSize: '1.1rem',
                color: 'var(--color-gold-bright)',
                marginBottom: '0.25rem',
              }}>
                Active Equipment Loadout
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
              flexGrow: 1,
            }}>
              {['weapon', 'helmet', 'armor', 'accessory'].map((slotKey) => {
                const item = equipped[slotKey]
                const rarityColor = item ? RARITY_COLORS[item.rarity] || '#fff' : 'var(--color-border)'
                const icon = item ? ITEM_ICONS[item.item_key] || '📦' : SLOT_ICONS[slotKey]
                const isConsumable = item?.is_consumable || [
                  'worn_shield', 'knights_helm', 'chain_mail', 'plate_armor',
                  'dragon_helm', 'soldiers_ring', 'blessed_seal', 'rune_talisman', 'ancient_bulwark'
                ].includes(item?.item_key)

                return (
                  <div
                    key={slotKey}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '0.85rem',
                      background: 'rgba(0,0,0,0.45)',
                      border: '1px solid #232430',
                      boxShadow: 'none',
                    }}
                  >
                    <div>
                      {/* Slot Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.6rem',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        paddingBottom: '0.35rem',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-pixel)',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-dim)',
                          textTransform: 'uppercase',
                        }}>
                          {slotKey}
                        </span>

                      </div>

                      {/* Icon & Name */}
                      {item ? (
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
                            {typeof icon === 'string' && icon.startsWith('/') ? (
                              <img src={icon} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }} />
                            ) : (
                              icon
                            )}
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
                              color: 'var(--color-text-dim)',
                              textTransform: 'uppercase',
                            }}>
                              {item.rarity}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          padding: '1.5rem 0',
                          marginBottom: '0.75rem',
                          background: 'rgba(0,0,0,0.2)',
                          border: '1px dashed rgba(255,255,255,0.1)',
                        }}>
                          <div style={{
                            fontFamily: 'var(--font-title)',
                            fontSize: '0.9rem',
                            color: 'var(--color-text-muted)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                          }}>
                            EMPTY SLOT
                          </div>
                        </div>
                      )}

                      {/* Stat summary */}
                      {item ? (
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                          {item.strength_bonus > 0 && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: 'var(--color-gold-bright)', background: 'transparent', padding: '2px 6px', border: '1px solid var(--color-gold-dim)' }}>
                              +{item.strength_bonus} ATTACK
                            </span>
                          )}
                          {item.poise_bonus > 0 && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: 'var(--color-text)', background: 'transparent', padding: '2px 6px', border: '1px solid var(--color-border)' }}>
                              +{item.poise_bonus} POISE
                            </span>
                          )}
                          {item.vigor_bonus > 0 && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: 'var(--color-crimson-bright)', background: 'transparent', padding: '2px 6px', border: '1px solid #5a1414' }}>
                              +{item.vigor_bonus} VIGOR
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontStyle: 'italic', textAlign: 'center' }}>
                          Equip gear from pouch below
                        </div>
                      )}
                    </div>

                    {item && (
                      <button
                        onClick={() => handleUnequip(slotKey)}
                        disabled={actionInProgress}
                        className="pixel-btn"
                        style={{ fontSize: '0.55rem', padding: '0.35rem 0.5rem', width: '100%', marginTop: '0.4rem' }}
                      >
                        Unequip
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
      </div>

      {/* 2. Owned Pouch Inventory Grid (Full width below) */}
      <div className="pixel-panel" style={{ padding: '1.25rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-title)',
                fontSize: '1.1rem',
                color: 'var(--color-gold)',
                marginBottom: '0.25rem',
              }}>
                Pouch Items ({inventory.length})
              </h2>
            </div>

            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Opening Pouch...
              </div>
            ) : inventory.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎒</div>
                <h3 style={{ fontFamily: 'var(--font-title)', color: '#fff', marginBottom: '0.3rem' }}>
                  Your Pouch is Empty
                </h3>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                  Visit the Merchant's Vault or defeat Bosses to gather gear.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
              }}>
                {inventory.map((invItem) => {
                  const item = invItem.item_details || invItem
                  const quantity = invItem.quantity || 1
                  const rarityColor = RARITY_COLORS[item.rarity] || '#fff'
                  const icon = ITEM_ICONS[item.item_key] || '📦'
                  const isConsumable = item.is_consumable || [
                    'worn_shield', 'knights_helm', 'chain_mail', 'plate_armor',
                    'dragon_helm', 'soldiers_ring', 'blessed_seal', 'rune_talisman', 'ancient_bulwark'
                  ].includes(item.item_key)

                  return (
                    <div
                      key={item.inventory_id || item.item_key}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid #232430',
                        boxShadow: 'none',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                      }}
                    >
                      {/* Quantity Badge */}
                      {quantity > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-gold-bright)',
                          fontFamily: 'var(--font-stat)',
                          fontSize: '1rem',
                          padding: '1px 5px',
                        }}>
                          x{quantity}
                        </div>
                      )}

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
                            {typeof icon === 'string' && icon.startsWith('/') ? (
                              <img src={icon} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }} />
                            ) : (
                              icon
                            )}
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
                              color: 'var(--color-text-dim)',
                              textTransform: 'uppercase',
                            }}>
                              {item.rarity} {item.type}
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '1.15rem', color: 'var(--color-text-dim)', marginBottom: '1rem', lineHeight: 1.4 }}>
                          {item.description}
                        </p>

                        {/* Stat summary */}
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                          {item.strength_bonus > 0 && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: 'var(--color-gold-bright)', background: 'transparent', padding: '2px 6px', border: '1px solid var(--color-gold-dim)' }}>
                              +{item.strength_bonus} ATTACK
                            </span>
                          )}
                          {item.poise_bonus > 0 && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: 'var(--color-text)', background: 'transparent', padding: '2px 6px', border: '1px solid var(--color-border)' }}>
                              +{item.poise_bonus} POISE
                            </span>
                          )}
                          {item.vigor_bonus > 0 && (
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-stat)', color: 'var(--color-crimson-bright)', background: 'transparent', padding: '2px 6px', border: '1px solid #5a1414' }}>
                              +{item.vigor_bonus} VIGOR
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Equip action */}
                      <div>
                        <button
                          onClick={() => handleEquip(item)}
                          disabled={actionInProgress}
                          className="pixel-btn pixel-btn-gold"
                          style={{ width: '100%', fontSize: '0.65rem', padding: '0.45rem' }}
                        >
                          Equip Item
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
    </div>
  )
}
