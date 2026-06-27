import { createEnv } from "@t3-oss/env-core"
import * as z from "zod"

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_APP_ENV: z.enum(["production", "preview", "development"]),
    EXPO_PUBLIC_LOCAL_API_URL: z.url().optional(),
  },
  runtimeEnv: process.env,
})
