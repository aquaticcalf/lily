import axios from "axios"

export const client = axios.create()

export function createServiceClient(baseURL: string) {
  return axios.create({ baseURL })
}
