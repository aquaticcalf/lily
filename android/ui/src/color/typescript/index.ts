import { mkdir, writeFile } from "node:fs/promises"
import colors from "tailwindcss/colors.js"
import Color from "colorjs.io"

const outputDir = ".."

const validFamilies = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

async function generateColors() {
  await mkdir(outputDir, { recursive: true })

  for (const family of validFamilies) {
    const palette = colors[family as keyof typeof colors]

    const className = family.charAt(0).toUpperCase() + family.slice(1)

    const fileName = family.toLowerCase()

    let kotlinCode =
      `package ui.color\n\n` +
      `import androidx.compose.ui.graphics.Color\n\n` +
      `object ${className} {\n`

    for (const [shade, value] of Object.entries(palette)) {
      if (typeof value === "string") {
        let hexValue = value

        if (value.startsWith("oklch")) {
          hexValue = new Color(value).to("srgb").toString({ format: "hex" })
        }

        const composeHex = `0xFF${hexValue.replace("#", "").toUpperCase()}`
        kotlinCode += `    val shade${shade} = Color(${composeHex})\n`
      }
    }

    kotlinCode += `}\n`

    await writeFile(`${outputDir}/${fileName}.kt`, kotlinCode)
    console.log(`generated ${fileName}.kt`)
  }

  const baseCode =
    `package ui.color\n\n` +
    `import androidx.compose.ui.graphics.Color\n\n` +
    `object BaseColors {\n` +
    `    val white = Color(0xFFFFFFFF)\n` +
    `    val black = Color(0xFF000000)\n` +
    `    val transparent = Color(0x00000000)\n` +
    `}\n`

  await writeFile(`${outputDir}/base.kt`, baseCode)
  console.log("generated base.kt")
}

generateColors().catch(console.error)
