export interface SpacingScale {
  0: number
  px: number
  0.5: number
  1: number
  1.5: number
  2: number
  2.5: number
  3: number
  3.5: number
  4: number
  5: number
  6: number
  7: number
  8: number
  9: number
  10: number
  11: number
  12: number
  14: number
  16: number
  20: number
  24: number
  28: number
  32: number
  36: number
  40: number
  44: number
  48: number
  52: number
  56: number
  60: number
  64: number
  72: number
  80: number
  96: number
}

export interface TypeScaleEntry {
  fontSize: number
  lineHeight: number
  letterSpacing: number
}

export interface TypeScale {
  xs: TypeScaleEntry
  sm: TypeScaleEntry
  base: TypeScaleEntry
  lg: TypeScaleEntry
  xl: TypeScaleEntry
  "2xl": TypeScaleEntry
  "3xl": TypeScaleEntry
  "4xl": TypeScaleEntry
  "5xl": TypeScaleEntry
  "6xl": TypeScaleEntry
}

export interface FontWeightScale {
  thin: "100"
  extralight: "200"
  light: "300"
  normal: "400"
  medium: "500"
  semibold: "600"
  bold: "700"
  extrabold: "800"
  black: "900"
}

export interface FontFamilyScale {
  sans: string
  serif: string
  mono: string
}

export interface RadiusScale {
  none: number
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  "2xl": number
  "3xl": number
  full: number
}

export interface ShadowDefinition {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export interface ShadowScale {
  none: ShadowDefinition
  xs: ShadowDefinition
  sm: ShadowDefinition
  md: ShadowDefinition
  lg: ShadowDefinition
  xl: ShadowDefinition
  "2xl": ShadowDefinition
}

export interface ZIndexScale {
  hide: number
  base: number
  docked: number
  dropdown: number
  sticky: number
  banner: number
  overlay: number
  modal: number
  popover: number
  toast: number
  tooltip: number
}

export interface DurationScale {
  instant: number
  fast: number
  normal: number
  slow: number
  slower: number
  slowest: number
}

export interface OpacityScale {
  0: number
  5: number
  10: number
  20: number
  25: number
  30: number
  40: number
  50: number
  60: number
  70: number
  75: number
  80: number
  90: number
  95: number
  100: number
}

export interface SizeScale {
  touchTarget: number
  iconXs: number
  iconSm: number
  iconMd: number
  iconLg: number
  iconXl: number
  inputSm: number
  inputMd: number
  inputLg: number
  buttonSm: number
  buttonMd: number
  buttonLg: number
  avatarXs: number
  avatarSm: number
  avatarMd: number
  avatarLg: number
  avatarXl: number
}

export interface SemanticColors {
  background: {
    app: string
    subtle: string
    surface: string
    surfaceHover: string
    surfaceActive: string
    elevated: string
    muted: string
    inverse: string
  }

  foreground: {
    default: string
    muted: string
    subtle: string
    inverse: string
    disabled: string
  }

  brand: {
    default: string
    hover: string
    active: string
    subtle: string
    subtleHover: string
    subtleActive: string
    muted: string
    emphasis: string
    foreground: string
    foregroundMuted: string
  }

  border: {
    default: string
    muted: string
    subtle: string
    emphasis: string
    disabled: string
    inverse: string
    focus: string
  }

  success: {
    default: string
    hover: string
    active: string
    subtle: string
    subtleHover: string
    subtleActive: string
    muted: string
    emphasis: string
    foreground: string
    border: string
  }

  warning: {
    default: string
    hover: string
    active: string
    subtle: string
    subtleHover: string
    subtleActive: string
    muted: string
    emphasis: string
    foreground: string
    border: string
  }

  error: {
    default: string
    hover: string
    active: string
    subtle: string
    subtleHover: string
    subtleActive: string
    muted: string
    emphasis: string
    foreground: string
    border: string
  }

  info: {
    default: string
    hover: string
    active: string
    subtle: string
    subtleHover: string
    subtleActive: string
    muted: string
    emphasis: string
    foreground: string
    border: string
  }

  overlay: {
    default: string
    subtle: string
    intense: string
  }
}

export type ThemeMode = "light" | "dark" | "system"

export interface Theme {
  name: string
  mode: "light" | "dark"
  colors: SemanticColors
  spacing: SpacingScale
  typography: {
    scale: TypeScale
    weights: FontWeightScale
    families: FontFamilyScale
  }
  radius: RadiusScale
  shadows: ShadowScale
  zIndex: ZIndexScale
  duration: DurationScale
  opacity: OpacityScale
  sizes: SizeScale
}
