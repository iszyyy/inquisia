import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { authApi } from '../lib/api'
import type { User } from '../lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionContextValue {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// ─── Safe default (used when context is accessed outside provider / during HMR) ──

const DEFAULT_VALUE: SessionContextValue = {
  user: null,
  isLoading: true,
  login: () => undefined,
  logout: async () => undefined,
  refresh: async () => undefined,
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue>(DEFAULT_VALUE)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await authApi.session()
      if (res.success) {
        setUser(res.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Listen for 401 events from the API client
  useEffect(() => {
    const handler = () => {
      setUser(null)
    }
    window.addEventListener('inquisia:unauthorized', handler)
    return () => window.removeEventListener('inquisia:unauthorized', handler)
  }, [])

  const login = useCallback((newUser: User) => {
    setUser(newUser)
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  return (
    <SessionContext.Provider value={{ user, isLoading, login, logout, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): SessionContextValue {
  return useContext(SessionContext)
}
