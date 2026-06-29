import { createEnv } from "@t3-oss/env-core"
import { string, url } from "zod"

export const env = createEnv({
  server: {
    GOOGLE_CLIENT_ID: string().min(1),
    CONVEX_URL: url(),
    CONVEX_ADMIN_KEY: string().min(1),
  },
  runtimeEnv: process.env,
})
