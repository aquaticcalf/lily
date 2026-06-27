export { configureThemes } from "./setup"
export { ThemeProvider } from "./context"
export type { ThemeProviderProps } from "./context"
export { useThemedStyles, createThemedStyleSheet } from "./hooks"

export {
  Box,
  ThemedText,
  HStack,
  VStack,
  ThemedScrollView,
  ThemedPressable,
  ThemedTextInput,
} from "./primitives"
export type {
  BoxProps,
  TextProps,
  HStackProps,
  VStackProps,
} from "./primitives"

export {
  SafeAreaView,
  KeyboardAvoidingView,
  FlatList,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
  Image,
  StatusBar,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Alert,
} from "react-native"

export type {
  Theme,
  SemanticColors,
  SpacingScale,
  TypeScale,
  TypeScaleEntry,
  FontWeightScale,
  FontFamilyScale,
  RadiusScale,
  ShadowScale,
  ShadowDefinition,
  ZIndexScale,
  DurationScale,
  OpacityScale,
  SizeScale,
} from "./types"
