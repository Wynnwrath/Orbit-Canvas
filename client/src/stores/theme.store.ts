import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

interface ThemeState {
  mode: 'light' | 'dark'
  accent: string
  fontFamily: 'inter' | 'serif'
  glassIntensity: 'subtle' | 'medium' | 'bold'
}

interface ThemeActions {
  setMode: (mode: ThemeState['mode']) => void
  setAccent: (color: string) => void
  setFontFamily: (font: ThemeState['fontFamily']) => void
  setGlassIntensity: (intensity: ThemeState['glassIntensity']) => void
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    immer((set) => ({
      mode: 'dark',
      accent: '#22d3ee',
      fontFamily: 'inter',
      glassIntensity: 'medium',

      setMode: (mode) => set((s) => { s.mode = mode }),
      setAccent: (color) => set((s) => { s.accent = color }),
      setFontFamily: (font) => set((s) => { s.fontFamily = font }),
      setGlassIntensity: (intensity) => set((s) => { s.glassIntensity = intensity }),
    })),
    { name: 'theme-prefs' }
  )
)
