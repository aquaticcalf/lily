import axios from "axios"
import { appConfig } from "../config"

export const client = axios.create({
  baseURL: appConfig.url,
  headers: {
    "X-App-Mode": appConfig.mode,
  },
})
