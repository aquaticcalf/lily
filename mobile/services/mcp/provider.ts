import * as SecureStore from "expo-secure-store"
import type {
  OAuthClientMetadata,
  OAuthClientInformation,
  OAuthTokens,
  OAuthDiscoveryState,
} from "./types"

function sanitizeKey(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "_")
}

const STORAGE_KEYS = {
  tokens: (id: string) => `mcp.${sanitizeKey(id)}.tokens`,
  clientInfo: (id: string) => `mcp.${sanitizeKey(id)}.clientInfo`,
  codeVerifier: (id: string) => `mcp.${sanitizeKey(id)}.codeVerifier`,
  discoveryState: (id: string) => `mcp.${sanitizeKey(id)}.discovery`,
} as const

async function setLargeItemAsync(key: string, value: string) {
  const CHUNK_SIZE = 2000
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.deleteItemAsync(`${key}.count`)
    await SecureStore.setItemAsync(key, value)
    return
  }

  const numChunks = Math.ceil(value.length / CHUNK_SIZE)
  await SecureStore.setItemAsync(`${key}.count`, numChunks.toString())
  for (let i = 0; i < numChunks; i++) {
    await SecureStore.setItemAsync(
      `${key}.${i}`,
      value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
    )
  }
}

async function getLargeItemAsync(key: string): Promise<string | null> {
  const countStr = await SecureStore.getItemAsync(`${key}.count`)
  if (!countStr) {
    return await SecureStore.getItemAsync(key)
  }
  const count = parseInt(countStr, 10)
  let result = ""
  for (let i = 0; i < count; i++) {
    const chunk = await SecureStore.getItemAsync(`${key}.${i}`)
    if (chunk) result += chunk
  }
  return result
}

async function deleteLargeItemAsync(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}.count`)
  if (countStr) {
    const count = parseInt(countStr, 10)
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}.${i}`)
    }
    await SecureStore.deleteItemAsync(`${key}.count`)
  }
  await SecureStore.deleteItemAsync(key)
}

export class SecureStoreOAuthClientProvider {
  private _authUrl: string | null = null
  private _redirectPort: number | null = null

  constructor(
    private _serviceId: string,
    private scheme: string = "lily",
  ) {}

  get serviceId(): string {
    return this._serviceId
  }

  get redirectUrl(): string {
    return `${this.scheme}://auth/mcp/${this._serviceId}`
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      redirect_uris: [this.redirectUrl],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }
  }

  setRedirectPort(port: number): void {
    this._redirectPort = port
  }

  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    const raw = await getLargeItemAsync(STORAGE_KEYS.clientInfo(this._serviceId))
    return raw ? JSON.parse(raw) : undefined
  }

  async saveClientInformation(clientInfo: OAuthClientInformation): Promise<void> {
    await setLargeItemAsync(STORAGE_KEYS.clientInfo(this._serviceId), JSON.stringify(clientInfo))
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    const raw = await getLargeItemAsync(STORAGE_KEYS.tokens(this._serviceId))
    return raw ? JSON.parse(raw) : undefined
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    await setLargeItemAsync(STORAGE_KEYS.tokens(this._serviceId), JSON.stringify(tokens))
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    this._authUrl = authorizationUrl.toString()
  }

  getAuthorizationUrl(): string | null {
    return this._authUrl
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await setLargeItemAsync(STORAGE_KEYS.codeVerifier(this._serviceId), codeVerifier)
  }

  async codeVerifier(): Promise<string> {
    const verifier = await getLargeItemAsync(STORAGE_KEYS.codeVerifier(this._serviceId))
    if (!verifier) throw new Error("No code verifier found")
    return verifier
  }

  async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
    await setLargeItemAsync(STORAGE_KEYS.discoveryState(this._serviceId), JSON.stringify(state))
  }

  async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
    const raw = await getLargeItemAsync(STORAGE_KEYS.discoveryState(this._serviceId))
    return raw ? JSON.parse(raw) : undefined
  }

  async invalidateCredentials(
    scope: "all" | "client" | "tokens" | "verifier" | "discovery",
  ): Promise<void> {
    if (scope === "all" || scope === "tokens") {
      await deleteLargeItemAsync(STORAGE_KEYS.tokens(this._serviceId))
    }
    if (scope === "all" || scope === "client") {
      await deleteLargeItemAsync(STORAGE_KEYS.clientInfo(this._serviceId))
    }
    if (scope === "all" || scope === "verifier") {
      await deleteLargeItemAsync(STORAGE_KEYS.codeVerifier(this._serviceId))
    }
    if (scope === "all" || scope === "discovery") {
      await deleteLargeItemAsync(STORAGE_KEYS.discoveryState(this._serviceId))
    }
  }
}
