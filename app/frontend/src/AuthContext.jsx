import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/me')
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api.post('/api/login', { email, password })
        setUser(data)
        return data
      },
      async signup(email, password, passwordConfirmation) {
        const data = await api.post('/api/signup', {
          user: {
            email,
            password,
            password_confirmation: passwordConfirmation,
          },
        })
        setUser(data)
        return data
      },
      async logout() {
        await api.delete('/api/logout')
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
