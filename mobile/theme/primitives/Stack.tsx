import { View, type ViewProps } from "react-native"

export interface HStackProps extends ViewProps {
  gap?: number
}

export interface VStackProps extends ViewProps {
  gap?: number
}

export function HStack({ gap, style, ...viewProps }: HStackProps) {
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center" },
        gap !== undefined && { gap },
        style,
      ]}
      {...viewProps}
    />
  )
}

export function VStack({ gap, style, ...viewProps }: VStackProps) {
  return (
    <View
      style={[{ flexDirection: "column" }, gap !== undefined && { gap }, style]}
      {...viewProps}
    />
  )
}
