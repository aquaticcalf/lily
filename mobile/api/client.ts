import axios from "axios"
import { appConfig } from "../config"

export const client = axios.create({
  baseURL: appConfig.url,
  headers: {
    "X-App-Mode": appConfig.mode,
  },
})

export function setAuthToken(token: string | null) {
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common["Authorization"]
  }
}
