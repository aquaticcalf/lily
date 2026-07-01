import { StreamableHTTPTransport } from "./transport"
import { SecureStoreOAuthClientProvider } from "./provider"
import { authorizeService, discoverOAuthServerInfo } from "./auth"
import type { ConnectedMCPService, MCPServiceConfig } from "./types"
import {
  ErrorCode,
  LATEST_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
  McpError,
  isJSONRPCResultResponse,
  isJSONRPCErrorResponse,
  isJSONRPCNotification,
} from "./types"
import type {
  InitializeResult,
  ListToolsResult,
  CallToolResult,
  ListResourcesResult,
  ListResourceTemplatesResult,
  ReadResourceResult,
  ListPromptsResult,
  GetPromptResult,
  CompleteResult,
  CompleteParams,
  ServerCapabilities,
  Implementation,
  ClientCapabilities,
} from "./types"

const DEFAULT_REQUEST_TIMEOUT = 60_000

interface PendingRequest {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

export class MCPClient {
  private _transport?: StreamableHTTPTransport
  private _requestId = 0
  private _pending = new Map<number, PendingRequest>()
  private _serverCapabilities?: ServerCapabilities
  private _serverVersion?: Implementation
  private _instructions?: string
  private _clientInfo: Implementation
  private _capabilities: ClientCapabilities

  constructor(clientInfo: Implementation, options?: { capabilities?: ClientCapabilities }) {
    this._clientInfo = clientInfo
    this._capabilities = options?.capabilities ?? {}
  }

  get transport(): StreamableHTTPTransport | undefined {
    return this._transport
  }

  getServerCapabilities(): ServerCapabilities | undefined {
    return this._serverCapabilities
  }

  getServerVersion(): Implementation | undefined {
    return this._serverVersion
  }

  getInstructions(): string | undefined {
    return this._instructions
  }

  async connect(transport: StreamableHTTPTransport): Promise<void> {
    this._transport = transport
    transport.onmessage = (msg) => this._onmessage(msg)
    transport.onerror = (error) => this._onerror(error)
    transport.onclose = () => this._onclose()

    await transport.start()

    if (transport.sessionId !== undefined) return

    try {
      const result = await this.request<InitializeResult>("initialize", {
        protocolVersion: LATEST_PROTOCOL_VERSION,
        capabilities: this._capabilities,
        clientInfo: this._clientInfo,
      })

      if (!SUPPORTED_PROTOCOL_VERSIONS.includes(result.protocolVersion)) {
        throw new Error(`Unsupported protocol version: ${result.protocolVersion}`)
      }

      this._serverCapabilities = result.capabilities
      this._serverVersion = result.serverInfo
      this._instructions = result.instructions

      if (transport.setProtocolVersion) {
        transport.setProtocolVersion(result.protocolVersion)
      }

      await this.notification("notifications/initialized")
    } catch (error) {
      await this.close()
      throw error
    }
  }

  async close(): Promise<void> {
    for (const pending of this._pending.values()) {
      clearTimeout(pending.timeout)
      pending.reject(new McpError(ErrorCode.ConnectionClosed, "Connection closed"))
    }
    this._pending.clear()
    await this._transport?.close()
    this._transport = undefined
  }

  private _nextId(): number {
    return this._requestId++
  }

  async request<T>(
    method: string,
    params?: Record<string, unknown>,
    options?: { timeout?: number },
  ): Promise<T> {
    if (!this._transport) throw new Error("Not connected")

    const id = this._nextId()
    const message = { jsonrpc: "2.0" as const, id, method, params }

    return new Promise<T>((resolve, reject) => {
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT
      const timeoutId = setTimeout(() => {
        this._pending.delete(id)
        reject(new McpError(ErrorCode.RequestTimeout, `Request timed out: ${method}`))
      }, timeout)

      this._pending.set(id, {
        resolve: resolve as (result: unknown) => void,
        reject,
        timeout: timeoutId,
      })

      this._transport!.send(message).catch((error) => {
        this._pending.delete(id)
        clearTimeout(timeoutId)
        reject(error)
      })
    })
  }

  async notification(method: string, params?: Record<string, unknown>): Promise<void> {
    if (!this._transport) throw new Error("Not connected")
    await this._transport.send({
      jsonrpc: "2.0" as const,
      method,
      ...(params ? { params } : {}),
    })
  }

  private _onmessage(msg: import("./types").JSONRPCMessage): void {
    if (isJSONRPCResultResponse(msg)) {
      const pending = this._pending.get(msg.id)
      if (pending) {
        this._pending.delete(msg.id)
        clearTimeout(pending.timeout)
        pending.resolve(msg.result)
      }
    } else if (isJSONRPCErrorResponse(msg)) {
      const pending = this._pending.get(msg.id)
      if (pending) {
        this._pending.delete(msg.id)
        clearTimeout(pending.timeout)
        pending.reject(new McpError(msg.error.code, msg.error.message, msg.error.data))
      }
    } else if (isJSONRPCNotification(msg)) {
      this.onnotification?.(msg.method, msg.params)
    }
  }

  onnotification?: (method: string, params?: Record<string, unknown>) => void
  onerror?: (error: Error) => void
  onclose?: () => void

  private _onerror(error: Error): void {
    this.onerror?.(error)
  }

  private _onclose(): void {
    for (const pending of this._pending.values()) {
      clearTimeout(pending.timeout)
      pending.reject(new McpError(ErrorCode.ConnectionClosed, "Connection closed"))
    }
    this._pending.clear()
    this.onclose?.()
  }

  async ping(options?: { timeout?: number }): Promise<void> {
    await this.request("ping", undefined, options)
  }

  async listTools(
    params?: { cursor?: string },
    options?: { timeout?: number },
  ): Promise<ListToolsResult> {
    return this.request<ListToolsResult>("tools/list", params, options)
  }

  async callTool(
    params: { name: string; arguments?: Record<string, unknown> },
    options?: { timeout?: number },
  ): Promise<CallToolResult> {
    return this.request<CallToolResult>("tools/call", params, options)
  }

  async listResources(
    params?: { cursor?: string },
    options?: { timeout?: number },
  ): Promise<ListResourcesResult> {
    return this.request<ListResourcesResult>("resources/list", params, options)
  }

  async listResourceTemplates(
    params?: { cursor?: string },
    options?: { timeout?: number },
  ): Promise<ListResourceTemplatesResult> {
    return this.request<ListResourceTemplatesResult>("resources/templates/list", params, options)
  }

  async readResource(
    params: { uri: string },
    options?: { timeout?: number },
  ): Promise<ReadResourceResult> {
    return this.request<ReadResourceResult>("resources/read", params, options)
  }

  async subscribeResource(params: { uri: string }, options?: { timeout?: number }): Promise<void> {
    await this.request("resources/subscribe", params, options)
  }

  async unsubscribeResource(
    params: { uri: string },
    options?: { timeout?: number },
  ): Promise<void> {
    await this.request("resources/unsubscribe", params, options)
  }

  async listPrompts(
    params?: { cursor?: string },
    options?: { timeout?: number },
  ): Promise<ListPromptsResult> {
    return this.request<ListPromptsResult>("prompts/list", params, options)
  }

  async getPrompt(
    params: { name: string; arguments?: Record<string, string> },
    options?: { timeout?: number },
  ): Promise<GetPromptResult> {
    return this.request<GetPromptResult>("prompts/get", params, options)
  }

  async complete(params: CompleteParams, options?: { timeout?: number }): Promise<CompleteResult> {
    return this.request<CompleteResult>(
      "completion/complete",
      params as unknown as Record<string, unknown>,
      options,
    )
  }

  async setLoggingLevel(level: string, options?: { timeout?: number }): Promise<void> {
    await this.request("logging/setLevel", { level }, options)
  }

  async sendRootsListChanged(): Promise<void> {
    await this.notification("notifications/roots/list_changed")
  }
}

export async function connectService(config: MCPServiceConfig): Promise<ConnectedMCPService> {
  const provider = new SecureStoreOAuthClientProvider(config.id)

  const serverInfo = await discoverOAuthServerInfo(config.serverUrl)
  await provider.saveDiscoveryState({
    authorizationServerUrl: serverInfo.authorizationServerUrl,
    authorizationServerMetadata: serverInfo.authorizationServerMetadata,
    resourceMetadata: serverInfo.resourceMetadata,
  })

  await authorizeService(provider, config.serverUrl)

  const transport = new StreamableHTTPTransport(config.serverUrl, {
    authProvider: provider,
  })

  const client = new MCPClient({ name: "lily", version: "1.0.0" }, { capabilities: {} })

  await client.connect(transport)

  return { config, client, transport, provider }
}

export async function disconnectService(connected: ConnectedMCPService): Promise<void> {
  try {
    await connected.transport.close()
  } catch {}
  try {
    await connected.client.close()
  } catch {}
  await connected.provider.invalidateCredentials("all")
}
