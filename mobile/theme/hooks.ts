import { useMemo } from "react"
import { StyleSheet, useUnistyles } from "react-native-unistyles"
import type { Theme } from "./types"

type StyleFactory<T> = (theme: Theme) => T

export function useThemedStyles<T extends Record<string, unknown>>(
  styleFactory: StyleFactory<T>,
): T {
  const { theme } = useUnistyles()
  return useMemo(
    () => StyleSheet.create(styleFactory(theme)),
    [theme, styleFactory],
  ) as T
}

export function createThemedStyleSheet<T extends Record<string, unknown>>(
  styleFactory: StyleFactory<T>,
): () => T {
  return function useStyles(): T {
    return useThemedStyles(styleFactory)
  }
}
