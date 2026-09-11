import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'aura-z-theme'
const THEME_COLOR: Record<Theme, string> = { dark: '#0b0518', light: '#f5f0fc' }

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/**
 * Dark is the app's default/native look; light is an opt-in alternative
 * toggled from the main menu. Applied as a `data-theme` attribute on
 * <html> so plain CSS (index.css) can flip every color token via the
 * cascade — no theme prop drilling into individual components needed.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore (private browsing / storage disabled)
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])

  return [theme, setTheme] as const
}
