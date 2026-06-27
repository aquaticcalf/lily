# theme

themed primitives for react native. uses unistyles under the hood for zero re-render on system theme changes.

## setup

call `configurethemes(light, dark)` at app entry.

```ts
import { configurethemes } from "#/theme"
import { lightTheme, darkTheme } from "./themes"

configurethemes(lightTheme, darkTheme)
```

## imports

everything comes from `#/theme`. no need to import from `react-native` for view/text/scrollview/pressable/textinput.

```ts
import {
  // themed (follows system theme, zero re-render):
  Box,
  ThemedText,
  ThemedScrollView,
  ThemedPressable,
  ThemedTextInput,

  // layout:
  HStack,
  VStack,

  // plain re-exports from react-native:
  SafeAreaView,
  KeyboardAvoidingView,
  FlatList,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  StatusBar,
  TouchableOpacity,
  Alert,

  // types:
  type Theme,
  type SemanticColors,

  // escape hatch for custom styled components:
  useThemedStyles,
  createThemedStyleSheet,
} from "#/theme"
```

## primitives

### box

`View` wrapper with a `bg` prop for background variants. no bg means transparent.

```tsx
<Box bg="surface">
  <ThemedText>content</ThemedText>
</Box>
```

bg accepts: `app`, `subtle`, `surface`, `surfaceHover`, `surfaceActive`, `elevated`, `muted`, `inverse`.

### themedtext

`Text` with default foreground color and base typography. accepts all `TextProps`.

```tsx
<ThemedText>default style</ThemedText>
<ThemedText style={{ fontWeight: "700" }}>override</ThemedText>
```

### themedscrollview

`ScrollView` with themed background. accepts all `ScrollViewProps`.

### themedpressable

`Pressable` wrapper. accepts all `PressableProps`.

### themedtextinput

`TextInput` wrapper. accepts all `TextInputProps`.

### hstack / vstack

flexbox layout with `gap` shorthand. accepts all `ViewProps`.

```tsx
<HStack gap={16}>
  <Box bg="subtle" />
  <Box bg="subtle" />
</HStack>

<VStack gap={8}>
  <ThemedText>row 1</ThemedText>
  <ThemedText>row 2</ThemedText>
</VStack>
```

## custom styles

use `usethemestyles` for one-off custom styled components. the factory runs inside unistyles' `stylesheet.create` so theme updates are zero re-render.

```tsx
import { useThemedStyles } from "#/theme"
import { View } from "react-native"

function Card() {
  const styles = useThemedStyles((theme) => ({
    card: {
      backgroundColor: theme.colors.background.elevated,
      padding: theme.spacing[4],
      borderRadius: theme.radius.md,
    },
  }))

  return <View style={styles.card} />
}
```

for reusable styled components, use `createthemestylesheet`:

```tsx
import { createThemedStyleSheet } from "#/theme"
import { View, Text } from "react-native"

const useStyles = createThemedStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing[4],
  },
  title: {
    color: theme.colors.foreground.default,
    fontSize: theme.typography.scale.lg.fontSize,
  },
}))

function ProfileCard() {
  const styles = useStyles()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>hello</Text>
    </View>
  )
}
```
