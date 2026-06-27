import { defineConfig } from "drizzle-kit"
import { env } from "./env"

export default defineConfig({
  schema: "./index.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: env.TURSO_CONNECTION_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
})
