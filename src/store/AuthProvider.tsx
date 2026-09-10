import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiUrl } from '../lib/api'

export interface AuthUser {
  sub: string
  email: string
  name: string
  picture?: string
}

type AuthStatus = 'loading' | 'signed-in' | 'signed-out'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  /** Exchanges a Google ID token for our own session cookie via the Flask backend. */
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    fetch(apiUrl('/api/me'), { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: AuthUser | null }) => {
        if (cancelled) return
        setUser(data.user)
        setStatus(data.user ? 'signed-in' : 'signed-out')
      })
      .catch(() => {
        if (!cancelled) setStatus('signed-out')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(apiUrl('/api/auth/google'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    if (!res.ok) throw new Error('구글 로그인에 실패했습니다.')
    const data: { user: AuthUser } = await res.json()
    setUser(data.user)
    setStatus('signed-in')
  }, [])

  const logout = useCallback(async () => {
    await fetch(apiUrl('/api/logout'), { method: 'POST', credentials: 'include' })
    setUser(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo(
    () => ({ user, status, loginWithGoogle, logout }),
    [user, status, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
