import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { setAccessToken, getAccessToken } from '../api/client'
import { playSound } from '../utils/sfx'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [character, setCharacter] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [soundMuted, setSoundMuted] = useState(() => {
    return localStorage.getItem('liferpg_muted') === 'true'
  })
  const [levelUpData, setLevelUpData] = useState(null)

  const toggleSound = () => {
    setSoundMuted((prev) => {
      const next = !prev
      localStorage.setItem('liferpg_muted', String(next))
      return next
    })
  }

  const fetchCharacter = useCallback(async () => {
    try {
      const { data } = await api.get('/character')
      if (data) {
        setCharacter({ ...data })
      }
      return data
    } catch (err) {
      console.error('Failed to fetch character:', err)
      return null
    }
  }, [])

  // Attempt initial session restore via refresh cookie
  useEffect(() => {
    let isMounted = true
    const initAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        if (data?.access_token) {
          setAccessToken(data.access_token)
          const charData = await fetchCharacter()
          if (isMounted && charData) {
            setUser({
              id: charData.user_id,
              username: charData.name,
            })
          }
        }
      } catch (e) {
        // Not logged in or expired refresh token
        setAccessToken(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initAuth()
    return () => {
      isMounted = false
    }
  }, [fetchCharacter])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAccessToken(data.access_token)
    setUser({
      id: data.user_id,
      username: data.username,
    })
    const char = await fetchCharacter()
    playSound('click', soundMuted)
    return { user: data, character: char }
  }

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password })
    setAccessToken(data.access_token)
    setUser({
      id: data.user_id,
      username: data.username,
      email: data.email,
    })
    const char = await fetchCharacter()
    playSound('click', soundMuted)
    return { user: data, character: char }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // ignore
    } finally {
      setAccessToken(null)
      setUser(null)
      setCharacter(null)
      playSound('click', soundMuted)
    }
  }

  const triggerLevelUp = (info) => {
    setLevelUpData(info)
    playSound('level_up', soundMuted)
  }

  const clearLevelUp = () => {
    setLevelUpData(null)
  }

  const updateCharacterState = (updater) => {
    setCharacter((prev) => {
      if (typeof updater === 'function') {
        return updater(prev)
      }
      return { ...prev, ...updater }
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        character,
        isAuthenticated: !!user && !!getAccessToken(),
        isLoading,
        soundMuted,
        toggleSound,
        login,
        register,
        logout,
        fetchCharacter,
        updateCharacterState,
        levelUpData,
        triggerLevelUp,
        clearLevelUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
