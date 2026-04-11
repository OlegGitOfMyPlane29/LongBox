import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'challenge100days-auth'

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { token: '', user: null }
  })

  const saveAuth = (nextState) => {
    setAuthState(nextState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  }

  const login = (token, user) => saveAuth({ token, user })
  const logout = () => {
    setAuthState({ token: '', user: null })
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token),
      login,
      logout,
      setUser: (user) => saveAuth({ token: authState.token, user }),
    }),
    [authState],
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
