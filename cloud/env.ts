import { createEnv } from "@t3-oss/env-core"
import { string, url } from "zod"

export const env = createEnv({
  server: {
    TURSO_CONNECTION_URL: url(),
    TURSO_AUTH_TOKEN: string().min(1),
    GOOGLE_CLIENT_ID: string().min(1),
  },
  runtimeEnv: process.env,
})
