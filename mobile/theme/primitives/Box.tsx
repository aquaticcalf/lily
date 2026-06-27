import { View, type ViewProps } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import type { Theme } from "../types"

const styles = StyleSheet.create((theme: Theme) => ({
  box: {
    variants: {
      bg: {
        app: { backgroundColor: theme.colors.background.app },
        subtle: { backgroundColor: theme.colors.background.subtle },
        surface: { backgroundColor: theme.colors.background.surface },
        surfaceHover: { backgroundColor: theme.colors.background.surfaceHover },
        surfaceActive: { backgroundColor: theme.colors.background.surfaceActive },
        elevated: { backgroundColor: theme.colors.background.elevated },
        muted: { backgroundColor: theme.colors.background.muted },
        inverse: { backgroundColor: theme.colors.background.inverse },
      },
    },
  },
}))

export interface ThemedViewProps extends ViewProps {
  bg?: keyof Theme["colors"]["background"]
}

export function Box({ bg, style, ...viewProps }: ThemedViewProps) {
  styles.useVariants({ bg })
  return <View style={[bg ? styles.box : undefined, style]} {...viewProps} />
}
