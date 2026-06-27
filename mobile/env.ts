import { createEnv } from "@t3-oss/env-core"
import { enum as select, url } from "zod"

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_APP_ENV: select(["production", "preview", "development"]),
    EXPO_PUBLIC_LOCAL_API_URL: url().optional(),
  },
  runtimeEnv: process.env,
})
