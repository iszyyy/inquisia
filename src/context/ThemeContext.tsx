import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  toggle: () => void
  setTheme: (t: Theme) => void
}

// ─── Safe default (used outside provider / during HMR) ────────────────────────

const DEFAULT_VALUE: ThemeContextValue = {
  theme: 'light',
  isDark: false,
  toggle: () => undefined,
  setTheme: () => undefined,
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>(DEFAULT_VALUE)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('inquisia-theme') as Theme | null
      if (stored === 'light' || stored === 'dark') return stored
    } catch {
      // localStorage unavailable
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('inquisia-theme', theme)
    } catch {
      // ignore
    }
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
