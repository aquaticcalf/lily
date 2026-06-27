import { StyleSheet, UnistylesRuntime } from "react-native-unistyles"
import type { Theme } from "./types"

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends Record<"light" | "dark", Theme> {}
}

export function configureThemes(light: Theme, dark: Theme) {
  StyleSheet.configure({
    themes: { light, dark },
  })
  UnistylesRuntime.setAdaptiveThemes(true)
}
