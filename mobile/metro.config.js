import { getDefaultConfig } from "expo/metro-config"
import { withUniwindConfig } from "uniwind/metro"

const config = getDefaultConfig(__dirname)

export default withUniwindConfig(config, {
  cssEntryFile: "./theme.css",
  dtsFile: "./uniwind.d.ts",
})
