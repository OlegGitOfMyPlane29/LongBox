/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { API_URL } from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'challenge100days-auth'

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: '', user: null }
    try {
      return JSON.parse(raw)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return { token: '', user: null }
    }
  })

  const saveAuth = useCallback((nextState) => {
    setAuthState(nextState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  }, [])

  const login = useCallback((token, user) => saveAuth({ token, user }), [saveAuth])
  const logout = useCallback(() => {
    setAuthState({ token: '', user: null })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener('challenge100days:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('challenge100days:unauthorized', handleUnauthorized)
  }, [logout])

  useEffect(() => {
    if (!authState.token) return

    let cancelled = false
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${authState.token}` },
        })
        if (!response.ok && !cancelled) {
          logout()
        }
      } catch {
        // Network issues should not force logout.
      }
    }

    validateToken()
    return () => {
      cancelled = true
    }
  }, [authState.token, logout])

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token),
      login,
      logout,
      setUser: (user) => saveAuth({ token: authState.token, user }),
    }),
    [authState, login, logout, saveAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('AuthContext не инициализирован')
  }
  return ctx
}
