import { type ReactNode } from "react"
import { configureThemes } from "./setup"
import type { Theme } from "./types"

export interface ThemeProviderProps {
  children: ReactNode
  lightTheme: Theme
  darkTheme: Theme
}

let configured = false

export function ThemeProvider({
  children,
  lightTheme,
  darkTheme,
}: ThemeProviderProps) {
  if (!configured) {
    configureThemes(lightTheme, darkTheme)
    configured = true
  }

  return <>{children}</>
}
