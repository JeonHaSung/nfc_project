/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getCsrf,
  getCurrentAdmin,
  loginAdmin,
  logoutAdmin,
  signupAdmin,
  updateCurrentAdmin,
} from '../api/auth/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [explicitLogout, setExplicitLogout] = useState(false)

  useEffect(() => {
    let active = true

    const initialize = async () => {
      try {
        await getCsrf()
        const currentUser = await getCurrentAdmin()
        if (active) setUser(currentUser)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    initialize()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const clearAuthentication = () => {
      setExplicitLogout(false)
      setUser(null)
      setLoading(false)
    }
    window.addEventListener('auth:unauthorized', clearAuthentication)
    return () => window.removeEventListener('auth:unauthorized', clearAuthentication)
  }, [])

  const login = useCallback(async (credentials) => {
    const authenticatedUser = await loginAdmin(credentials)
    setExplicitLogout(false)
    setUser(authenticatedUser)
    return authenticatedUser
  }, [])

  const signup = useCallback(async (payload) => {
    const authenticatedUser = await signupAdmin(payload)
    setExplicitLogout(false)
    setUser(authenticatedUser)
    return authenticatedUser
  }, [])

  const logout = useCallback(async () => {
    setExplicitLogout(true)
    try {
      await logoutAdmin()
    } finally {
      setUser(null)
    }
  }, [])

  const updateMe = useCallback(async (payload) => {
    const updatedUser = await updateCurrentAdmin(payload)
    setUser(updatedUser)
    return updatedUser
  }, [])

  const value = useMemo(
    () => ({ user, loading, explicitLogout, login, signup, logout, updateMe }),
    [user, loading, explicitLogout, login, signup, logout, updateMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.')
  return context
}
