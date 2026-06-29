import { createEnv } from "@t3-oss/env-core"
import { enum as select, string, url } from "zod"

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_APP_ENV: select(["production", "preview", "development"]),
    EXPO_PUBLIC_LOCAL_API_URL: url().optional(),
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string().min(1),
  },
  runtimeEnv: process.env,
})
