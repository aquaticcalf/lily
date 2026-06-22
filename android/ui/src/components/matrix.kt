package ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.isActive
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

typealias Frame = List<List<Number>>

enum class MatrixMode {
    Default,
    Vu,
}

data class MatrixPalette(
    val on: Color,
    val off: Color,
)

private fun clamp(value: Float): Float = value.coerceIn(0f, 1f)

private fun ensureFrameSize(frame: Frame, rows: Int, cols: Int): List<List<Float>> =
    List(rows) { row ->
        List(cols) { col ->
            frame.getOrNull(row)?.getOrNull(col)?.toFloat() ?: 0f
        }
    }

private fun emptyFrame(rows: Int, cols: Int): MutableList<MutableList<Number>> =
    MutableList(rows) { MutableList(cols) { 0f } }

private fun setPixel(
    frame: MutableList<MutableList<Number>>,
    row: Int,
    col: Int,
    value: Number,
) {
    if (row in frame.indices && col in frame[row].indices) {
        frame[row][col] = value
    }
}

val digits: List<Frame> = listOf(
    listOf(
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
    ),
    listOf(
        listOf(0, 0, 1, 0, 0),
        listOf(0, 1, 1, 0, 0),
        listOf(0, 0, 1, 0, 0),
        listOf(0, 0, 1, 0, 0),
        listOf(0, 0, 1, 0, 0),
        listOf(0, 0, 1, 0, 0),
        listOf(0, 1, 1, 1, 0),
    ),
    listOf(
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 0, 0, 0, 1),
        listOf(0, 0, 0, 1, 0),
        listOf(0, 0, 1, 0, 0),
        listOf(0, 1, 0, 0, 0),
        listOf(1, 1, 1, 1, 1),
    ),
    listOf(
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 0, 0, 0, 1),
        listOf(0, 0, 1, 1, 0),
        listOf(0, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
    ),
    listOf(
        listOf(0, 0, 0, 1, 0),
        listOf(0, 0, 1, 1, 0),
        listOf(0, 1, 0, 1, 0),
        listOf(1, 0, 0, 1, 0),
        listOf(1, 1, 1, 1, 1),
        listOf(0, 0, 0, 1, 0),
        listOf(0, 0, 0, 1, 0),
    ),
    listOf(
        listOf(1, 1, 1, 1, 1),
        listOf(1, 0, 0, 0, 0),
        listOf(1, 1, 1, 1, 0),
        listOf(0, 0, 0, 0, 1),
        listOf(0, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
    ),
    listOf(
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 0),
        listOf(1, 0, 0, 0, 0),
        listOf(1, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
    ),
    listOf(
        listOf(1, 1, 1, 1, 1),
        listOf(0, 0, 0, 0, 1),
        listOf(0, 0, 0, 1, 0),
        listOf(0, 0, 1, 0, 0),
        listOf(0, 1, 0, 0, 0),
        listOf(0, 1, 0, 0, 0),
        listOf(0, 1, 0, 0, 0),
    ),
    listOf(
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
    ),
    listOf(
        listOf(0, 1, 1, 1, 0),
        listOf(1, 0, 0, 0, 1),
        listOf(1, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 1),
        listOf(0, 0, 0, 0, 1),
        listOf(0, 0, 0, 0, 1),
        listOf(0, 1, 1, 1, 0),
    ),
)

val chevronLeft: Frame = listOf(
    listOf(0, 0, 0, 1, 0),
    listOf(0, 0, 1, 0, 0),
    listOf(0, 1, 0, 0, 0),
    listOf(0, 0, 1, 0, 0),
    listOf(0, 0, 0, 1, 0),
)

val chevronRight: Frame = listOf(
    listOf(0, 1, 0, 0, 0),
    listOf(0, 0, 1, 0, 0),
    listOf(0, 0, 0, 1, 0),
    listOf(0, 0, 1, 0, 0),
    listOf(0, 1, 0, 0, 0),
)

val loader: List<Frame> = buildList {
    val size = 7
    val center = 3
    val radius = 2.5

    repeat(12) { frame ->
        val result = emptyFrame(size, size)
        repeat(8) { index ->
            val angle = (frame / 12.0) * PI * 2 + (index / 8.0) * PI * 2
            val x = (center + cos(angle) * radius).roundToInt()
            val y = (center + sin(angle) * radius).roundToInt()
            val brightness = 1 - index / 10.0
            setPixel(result, y, x, max(0.2, brightness))
        }
        add(result)
    }
}

val pulse: List<Frame> = buildList {
    val size = 7
    val center = 3

    repeat(16) { frame ->
        val result = emptyFrame(size, size)
        val phase = (frame / 16.0) * PI * 2
        val intensity = (sin(phase) + 1) / 2

        setPixel(result, center, center, 1)

        val radius = floor((1 - intensity) * 3).toInt() + 1
        for (dy in -radius..radius) {
            for (dx in -radius..radius) {
                val distance = sqrt((dx * dx + dy * dy).toDouble())
                if (abs(distance - radius) < 0.7) {
                    setPixel(result, center + dy, center + dx, intensity * 0.6)
                }
            }
        }
        add(result)
    }
}

fun vu(columns: Int, levels: List<Number>): Frame {
    val rows = 7
    val frame = emptyFrame(rows, columns.coerceAtLeast(0))

    repeat(min(columns, levels.size).coerceAtLeast(0)) { col ->
        val level = levels[col].toFloat().coerceIn(0f, 1f)
        val height = floor(level * rows).toInt()

        repeat(rows) { row ->
            val rowFromBottom = rows - 1 - row
            if (rowFromBottom < height) {
                frame[row][col] = when {
                    row < rows * 0.3 -> 1f
                    row < rows * 0.6 -> 0.8f
                    else -> 0.6f
                }
            }
        }
    }

    return frame
}

val wave: List<Frame> = buildList {
    val rows = 7
    val cols = 7

    repeat(24) { frame ->
        val result = emptyFrame(rows, cols)
        val phase = (frame / 24.0) * PI * 2

        repeat(cols) { col ->
            val colPhase = (col / cols.toDouble()) * PI * 2
            val height = sin(phase + colPhase) * 2.5 + 3.5
            val row = floor(height).toInt()

            if (row in 0 until rows) {
                setPixel(result, row, col, 1)
                val fraction = height - row
                if (row > 0) setPixel(result, row - 1, col, 1 - fraction)
                if (row < rows - 1) setPixel(result, row + 1, col, fraction)
            }
        }
        add(result)
    }
}

val snake: List<Frame> = run {
    val rows = 7
    val cols = 7
    val path = mutableListOf<Pair<Int, Int>>()
    val visited = mutableSetOf<Pair<Int, Int>>()
    var x = 0
    var y = 0
    var dx = 1
    var dy = 0

    while (path.size < rows * cols) {
        path += y to x
        visited += y to x

        val nextX = x + dx
        val nextY = y + dy
        if (nextX in 0 until cols && nextY in 0 until rows && nextY to nextX !in visited) {
            x = nextX
            y = nextY
        } else {
            val newDx = -dy
            val newDy = dx
            dx = newDx
            dy = newDy

            val turnedX = x + dx
            val turnedY = y + dy
            if (turnedX in 0 until cols && turnedY in 0 until rows && turnedY to turnedX !in visited) {
                x = turnedX
                y = turnedY
            } else {
                break
            }
        }
    }

    List(path.size) { frame ->
        val result = emptyFrame(rows, cols)
        repeat(5) { index ->
            val pathIndex = frame - index
            if (pathIndex in path.indices) {
                val (pixelY, pixelX) = path[pathIndex]
                setPixel(result, pixelY, pixelX, 1f - index / 5f)
            }
        }
        result
    }
}

@Composable
fun Matrix(
    rows: Int,
    cols: Int,
    modifier: Modifier = Modifier,
    pattern: Frame? = null,
    frames: List<Frame>? = null,
    fps: Int = 12,
    autoplay: Boolean = true,
    loop: Boolean = true,
    cellSize: Dp = 10.dp,
    gap: Dp = 2.dp,
    palette: MatrixPalette = MatrixPalette(
        on = MaterialTheme.colorScheme.onSurface,
        off = MaterialTheme.colorScheme.onSurfaceVariant,
    ),
    brightness: Float = 1f,
    ariaLabel: String = "matrix display",
    onFrame: ((Int) -> Unit)? = null,
    mode: MatrixMode = MatrixMode.Default,
    levels: List<Number>? = null,
) {
    val safeRows = rows.coerceAtLeast(0)
    val safeCols = cols.coerceAtLeast(0)
    val safeFps = fps.coerceAtLeast(1)
    var frameIndex by remember(frames, autoplay) { mutableIntStateOf(0) }
    val currentOnFrame by rememberUpdatedState(onFrame)

    LaunchedEffect(frames, pattern, autoplay, loop, safeFps) {
        if (pattern != null || !autoplay || frames.isNullOrEmpty()) return@LaunchedEffect

        val frameIntervalNanos = 1_000_000_000L / safeFps
        var lastFrameTime = 0L
        var accumulator = 0L

        while (isActive) {
            withFrameNanos { currentTime ->
                if (lastFrameTime == 0L) {
                    lastFrameTime = currentTime
                }
                accumulator += currentTime - lastFrameTime
                lastFrameTime = currentTime

                if (accumulator >= frameIntervalNanos) {
                    accumulator -= frameIntervalNanos
                    val next = frameIndex + 1
                    if (next >= frames.size) {
                        if (loop) {
                            frameIndex = 0
                            currentOnFrame?.invoke(0)
                        } else {
                            return@withFrameNanos
                        }
                    } else {
                        frameIndex = next
                        currentOnFrame?.invoke(next)
                    }
                }
            }

            if (!loop && frameIndex >= frames.lastIndex) break
        }
    }

    val currentFrame = remember(pattern, frames, frameIndex, safeRows, safeCols, mode, levels) {
        when {
            mode == MatrixMode.Vu && !levels.isNullOrEmpty() ->
                ensureFrameSize(vu(safeCols, levels), safeRows, safeCols)

            pattern != null -> ensureFrameSize(pattern, safeRows, safeCols)
            !frames.isNullOrEmpty() ->
                ensureFrameSize(frames.getOrElse(frameIndex) { frames.first() }, safeRows, safeCols)

            else -> ensureFrameSize(emptyList(), safeRows, safeCols)
        }
    }

    val animatedValues = List(safeRows) { row ->
        List(safeCols) { col ->
            val target = clamp(brightness * currentFrame[row][col])
            animateFloatAsState(
                targetValue = target,
                animationSpec = tween(durationMillis = 300),
                label = "matrix-$row-$col",
            ).value
        }
    }

    val width = cellSize * safeCols + gap * (safeCols - 1).coerceAtLeast(0)
    val height = cellSize * safeRows + gap * (safeRows - 1).coerceAtLeast(0)
    val isAnimating = pattern == null && !frames.isNullOrEmpty()

    Canvas(
        modifier = modifier
            .size(width, height)
            .semantics {
                contentDescription = ariaLabel
                if (isAnimating) liveRegion = LiveRegionMode.Polite
            },
    ) {
        val cellSizePx = cellSize.toPx()
        val gapPx = gap.toPx()
        val radius = cellSizePx / 2f * 0.9f

        repeat(safeRows) { row ->
            repeat(safeCols) { col ->
                drawMatrixPixel(
                    center = Offset(
                        x = col * (cellSizePx + gapPx) + cellSizePx / 2f,
                        y = row * (cellSizePx + gapPx) + cellSizePx / 2f,
                    ),
                    radius = radius,
                    opacity = animatedValues[row][col],
                    palette = palette,
                )
            }
        }
    }
}

private fun DrawScope.drawMatrixPixel(
    center: Offset,
    radius: Float,
    opacity: Float,
    palette: MatrixPalette,
) {
    val isActive = opacity > 0.5f
    val isOn = opacity > 0.05f
    val scaledRadius = radius * if (isActive) 1.1f else 1f

    if (isActive) {
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    palette.on.copy(alpha = opacity * 0.35f),
                    Color.Transparent,
                ),
                center = center,
                radius = scaledRadius * 1.8f,
            ),
            radius = scaledRadius * 1.8f,
            center = center,
        )
    }

    val color = if (isOn) palette.on else palette.off
    val alpha = if (isOn) opacity else 0.1f
    drawCircle(
        brush = Brush.radialGradient(
            colorStops = arrayOf(
                0f to color.copy(alpha = alpha),
                0.7f to color.copy(alpha = alpha * 0.85f),
                1f to color.copy(alpha = alpha * 0.6f),
            ),
            center = center,
            radius = scaledRadius,
        ),
        radius = scaledRadius,
        center = center,
    )
}
