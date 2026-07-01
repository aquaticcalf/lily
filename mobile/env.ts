import { createEnv } from "@t3-oss/env-core"
import { string } from "zod"

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_APP_ENV: string().min(1),
  },
  runtimeEnv: process.env,
})
