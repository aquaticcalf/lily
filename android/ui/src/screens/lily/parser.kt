package ui.screens

import ui.components.Frame

internal fun lilyFrame(pixels: String): Frame =
    pixels
        .trimIndent()
        .lineSequence()
        .filter(String::isNotBlank)
        .map { row ->
            row.map { pixel ->
                when (pixel) {
                    'o' -> pixelOn
                    '+' -> pixelDim
                    '*' -> pixelFaint
                    else -> pixelOff
                }
            }
        }
        .toList()
