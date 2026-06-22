package ui.screens

import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import ui.components.Matrix
import ui.components.MatrixPalette

@Composable
fun Lily(palette: MatrixPalette) {
    Matrix(
        rows = LilyRows,
        cols = LilyColumns,
        frames = LilyFrames,
        fps = LilyFps,
        cellSize = LilyCellSize,
        gap = LilyGap,
        palette = palette,
        ariaLabel = "dancing lily",
    )
}
