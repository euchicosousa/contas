import * as React from 'react'
import { type Theme, setThemeFn } from '#/lib/theme'

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme: Theme
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(initialTheme)

  React.useEffect(() => {
    const root = window.document.documentElement

    const applyTheme = (t: Theme) => {
      root.classList.remove('light', 'dark')

      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
        return
      }

      root.classList.add(t)
    }

    applyTheme(theme)

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    // Atualiza o cookie no servidor silenciosamente
    setThemeFn({ data: newTheme })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
