import * as SecureStore from "expo-secure-store"
import type {
  OAuthClientProvider,
  OAuthDiscoveryState,
} from "@modelcontextprotocol/sdk/client/auth.js"
import type {
  OAuthClientMetadata,
  OAuthClientInformationMixed,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js"

const STORAGE_KEYS = {
  tokens: (id: string) => `mcp/${id}/tokens`,
  clientInfo: (id: string) => `mcp/${id}/clientInfo`,
  codeVerifier: (id: string) => `mcp/${id}/codeVerifier`,
  discoveryState: (id: string) => `mcp/${id}/discovery`,
} as const

export class SecureStoreOAuthClientProvider implements OAuthClientProvider {
  private _authUrl: string | null = null
  private _redirectPort: number | null = null

  constructor(
    private serviceId: string,
    private scheme: string = "lily",
  ) {}

  get redirectUrl(): string {
    if (this._redirectPort) {
      return `http://localhost:${this._redirectPort}/callback/${this.serviceId}`
    }
    return `${this.scheme}://auth/mcp/${this.serviceId}`
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

  async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.clientInfo(this.serviceId))
    return raw ? JSON.parse(raw) : undefined
  }

  async saveClientInformation(clientInfo: OAuthClientInformationMixed): Promise<void> {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.clientInfo(this.serviceId),
      JSON.stringify(clientInfo),
    )
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.tokens(this.serviceId))
    return raw ? JSON.parse(raw) : undefined
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.tokens(this.serviceId), JSON.stringify(tokens))
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    this._authUrl = authorizationUrl.toString()
  }

  getAuthorizationUrl(): string | null {
    return this._authUrl
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.codeVerifier(this.serviceId), codeVerifier)
  }

  async codeVerifier(): Promise<string> {
    const verifier = await SecureStore.getItemAsync(STORAGE_KEYS.codeVerifier(this.serviceId))
    if (!verifier) throw new Error("No code verifier found")
    return verifier
  }

  async saveDiscoveryState(state: OAuthDiscoveryState): Promise<void> {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.discoveryState(this.serviceId),
      JSON.stringify(state),
    )
  }

  async discoveryState(): Promise<OAuthDiscoveryState | undefined> {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.discoveryState(this.serviceId))
    return raw ? JSON.parse(raw) : undefined
  }

  async invalidateCredentials(
    scope: "all" | "client" | "tokens" | "verifier" | "discovery",
  ): Promise<void> {
    if (scope === "all" || scope === "tokens") {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.tokens(this.serviceId))
    }
    if (scope === "all" || scope === "client") {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.clientInfo(this.serviceId))
    }
    if (scope === "all" || scope === "verifier") {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.codeVerifier(this.serviceId))
    }
    if (scope === "all" || scope === "discovery") {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.discoveryState(this.serviceId))
    }
  }
}
