import { ScrollView, Pressable, TextInput } from "react-native"
import type { ScrollViewProps, PressableProps, TextInputProps } from "react-native"
import { StyleSheet } from "react-native-unistyles"
import type { Theme } from "../types"

const scrollStyles = StyleSheet.create((theme: Theme) => ({
  scroll: {
    backgroundColor: theme.colors.background.app,
  },
}))

export function ThemedScrollView({ style, ...props }: ScrollViewProps) {
  return <ScrollView style={[scrollStyles.scroll, style]} {...props} />
}

export function ThemedPressable({ style, ...props }: PressableProps) {
  return <Pressable style={style} {...props} />
}

export function ThemedTextInput({ style, ...props }: TextInputProps) {
  return <TextInput style={style} {...props} />
}
