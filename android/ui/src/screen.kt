import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import ui.components.MatrixPalette
import ui.screens.Lily

@Composable
fun Screen(
    darkTheme: Boolean = isSystemInDarkTheme(),
) {
    val colorScheme = if (darkTheme) DarkPalette else LightPalette

    MaterialTheme(colorScheme = colorScheme) {
        Column(
            modifier = Modifier
               .fillMaxSize()
               .background(MaterialTheme.colorScheme.background),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Lily(
                palette = MatrixPalette(
                    on = MaterialTheme.colorScheme.primary,
                    off = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.45f),
                ),
            )
        }
    }
}
