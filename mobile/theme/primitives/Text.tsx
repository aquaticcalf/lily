import { Text, type TextProps } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import type { Theme } from "../types"

const styles = StyleSheet.create((theme: Theme) => ({
  text: {
    color: theme.colors.foreground.default,
    fontSize: theme.typography.scale.base.fontSize,
    lineHeight: theme.typography.scale.base.lineHeight,
  },
}))

export interface ThemedTextProps extends TextProps {}

export function ThemedText({ style, ...textProps }: ThemedTextProps) {
  return <Text style={[styles.text, style]} {...textProps} />
}
