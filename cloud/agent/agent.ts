import { google } from "@ai-sdk/google"
import { defineAgent } from "eve"

export default defineAgent({
  model: google("gemini-3.1-flash-lite-preview"),
})
