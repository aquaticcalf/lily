import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import ui.color.Rose
import ui.color.BaseColors

val LightPalette = lightColorScheme(
    primary = Rose.shade500,
    onPrimary = BaseColors.white,
    primaryContainer = Rose.shade200,
    onPrimaryContainer = Rose.shade900,

    secondary = Rose.shade400,
    onSecondary = BaseColors.white,
    secondaryContainer = Rose.shade100,
    onSecondaryContainer = Rose.shade900,

    tertiary = Rose.shade600,
    onTertiary = BaseColors.white,
    tertiaryContainer = Rose.shade200,
    onTertiaryContainer = Rose.shade900,

    error = Rose.shade600,
    onError = BaseColors.white,
    errorContainer = Rose.shade100,
    onErrorContainer = Rose.shade900,

    background = Rose.shade50,
    onBackground = Rose.shade950,
    surface = Rose.shade50,
    onSurface = Rose.shade950,
    surfaceVariant = Rose.shade100,
    onSurfaceVariant = Rose.shade800,

    outline = Rose.shade300,
    outlineVariant = Rose.shade200,
    inverseSurface = Rose.shade900,
    inverseOnSurface = Rose.shade50,
    inversePrimary = Rose.shade300,
    scrim = BaseColors.black
)

val DarkPalette = darkColorScheme(
    primary = Rose.shade400,
    onPrimary = Rose.shade950,
    primaryContainer = Rose.shade700,
    onPrimaryContainer = Rose.shade100,

    secondary = Rose.shade300,
    onSecondary = Rose.shade950,
    secondaryContainer = Rose.shade800,
    onSecondaryContainer = Rose.shade100,

    tertiary = Rose.shade200,
    onTertiary = Rose.shade950,
    tertiaryContainer = Rose.shade800,
    onTertiaryContainer = Rose.shade100,

    error = Rose.shade400,
    onError = Rose.shade950,
    errorContainer = Rose.shade800,
    onErrorContainer = Rose.shade100,

    background = Rose.shade950,
    onBackground = Rose.shade100,
    surface = Rose.shade950,
    onSurface = Rose.shade100,
    surfaceVariant = Rose.shade900,
    onSurfaceVariant = Rose.shade200,

    outline = Rose.shade700,
    outlineVariant = Rose.shade800,
    inverseSurface = Rose.shade100,
    inverseOnSurface = Rose.shade950,
    inversePrimary = Rose.shade600,
    scrim = BaseColors.black
)