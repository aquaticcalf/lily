import { env } from "../env"

const APP_ENV = env.EXPO_PUBLIC_APP_ENV

const APP_CONFIG = {
  production: {
    url: "https://lily.calf.lol/eve/v1/",
    mode: "prod",
  },
  preview: {
    url: "https://lily.calf.lol/eve/v1/",
    mode: "staging",
  },
  development: {
    url: (process.env.LOCAL_API_URL || "http://localhost:3000") + "/eve/v1/",
    mode: "local",
  },
}

export const appConfig = APP_CONFIG[APP_ENV as keyof typeof APP_CONFIG] ?? APP_CONFIG.development
