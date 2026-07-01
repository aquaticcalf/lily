import type { Client } from "@modelcontextprotocol/sdk/client/index.js"
import type { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import type { SecureStoreOAuthClientProvider } from "./provider"

export interface MCPServiceConfig {
  id: string
  name: string
  serverUrl: string
  icon?: string
  authScope?: string
}

export interface ConnectedMCPService {
  config: MCPServiceConfig
  client: Client
  transport: StreamableHTTPClientTransport
  provider: SecureStoreOAuthClientProvider
}
