import type { SecureStoreOAuthClientProvider } from "./provider"

export interface JSONRPCRequest {
  jsonrpc: "2.0"
  id: number
  method: string
  params?: Record<string, unknown>
}

export interface JSONRPCResultResponse {
  jsonrpc: "2.0"
  id: number
  result?: unknown
}

export interface JSONRPCErrorResponse {
  jsonrpc: "2.0"
  id: number
  error: { code: number; message: string; data?: unknown }
}

export interface JSONRPCNotification {
  jsonrpc: "2.0"
  method: string
  params?: Record<string, unknown>
}

export type JSONRPCMessage =
  | JSONRPCRequest
  | JSONRPCResultResponse
  | JSONRPCErrorResponse
  | JSONRPCNotification

export function isJSONRPCRequest(msg: JSONRPCMessage): msg is JSONRPCRequest {
  return "id" in msg && "method" in msg
}

export function isJSONRPCResultResponse(msg: JSONRPCMessage): msg is JSONRPCResultResponse {
  return "id" in msg && "result" in msg && !("method" in msg)
}

export function isJSONRPCErrorResponse(msg: JSONRPCMessage): msg is JSONRPCErrorResponse {
  return "id" in msg && "error" in msg && !("method" in msg)
}

export function isJSONRPCNotification(msg: JSONRPCMessage): msg is JSONRPCNotification {
  return !("id" in msg) && "method" in msg && msg.method !== undefined
}

export function isInitializedNotification(msg: JSONRPCMessage): boolean {
  return isJSONRPCNotification(msg) && msg.method === "notifications/initialized"
}

export const ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ConnectionClosed: -32000,
  RequestTimeout: -32001,
} as const

export class McpError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = "McpError"
  }
}

export const LATEST_PROTOCOL_VERSION = "2025-03-26"
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-03-26", "2024-11-05"]

export interface Implementation {
  name: string
  version: string
}

export interface ClientCapabilities {
  roots?: { listChanged?: boolean }
  sampling?: Record<string, never>
  experimental?: Record<string, unknown>
}

export interface ServerCapabilities {
  logging?: Record<string, never>
  prompts?: { listChanged?: boolean }
  resources?: { subscribe?: boolean; listChanged?: boolean }
  tools?: { listChanged?: boolean }
  experimental?: Record<string, unknown>
}

export interface InitializeParams {
  protocolVersion: string
  capabilities: ClientCapabilities
  clientInfo: Implementation
}

export interface InitializeResult {
  protocolVersion: string
  capabilities: ServerCapabilities
  serverInfo: Implementation
  instructions?: string
}

export interface Tool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

export interface ListToolsResult {
  tools: Tool[]
  nextCursor?: string
}

export interface CallToolResult {
  content: Content[]
  isError?: boolean
}

export type Content = TextContent | ImageContent | AudioContent | ResourceContent | EmbeddedResource

export interface TextContent {
  type: "text"
  text: string
}

export interface ImageContent {
  type: "image"
  data: string
  mimeType: string
}

export interface AudioContent {
  type: "audio"
  data: string
  mimeType: string
}

export interface ResourceContent {
  type: "resource"
  resource: {
    uri: string
    mimeType?: string
    text?: string
    blob?: string
  }
}

export interface EmbeddedResource {
  type: "embedded-resource"
  resource: {
    uri: string
    mimeType?: string
    text?: string
    blob?: string
  }
}

export interface Resource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface ListResourcesResult {
  resources: Resource[]
  nextCursor?: string
}

export interface ResourceTemplate {
  uriTemplate: string
  name: string
  description?: string
  mimeType?: string
}

export interface ListResourceTemplatesResult {
  resourceTemplates: ResourceTemplate[]
  nextCursor?: string
}

export interface ReadResourceResult {
  contents: ResourceContent[]
}

export interface Prompt {
  name: string
  description?: string
  arguments?: PromptArgument[]
}

export interface PromptArgument {
  name: string
  description?: string
  required?: boolean
}

export interface GetPromptResult {
  description?: string
  messages: PromptMessage[]
}

export interface PromptMessage {
  role: "user" | "assistant"
  content: Content
}

export interface ListPromptsResult {
  prompts: Prompt[]
  nextCursor?: string
}

export interface CompleteResult {
  completion: string
  hasMore?: boolean
  total?: number
}

export interface CompleteParams {
  ref: PromptReference | ResourceReference
  argument: { name: string; value: string }
}

export interface PromptReference {
  type: "ref/prompt"
  name: string
}

export interface ResourceReference {
  type: "ref/resource"
  uri: string
}

export interface Transport {
  start(): Promise<void>
  send(message: JSONRPCMessage): Promise<void>
  close(): Promise<void>
  onmessage?: (message: JSONRPCMessage) => void
  onerror?: (error: Error) => void
  onclose?: () => void
  sessionId?: string
  setProtocolVersion?(version: string): void
  finishAuth?(authorizationCode: string): Promise<void>
}

export interface MCPServiceConfig {
  id: string
  name: string
  serverUrl: string
  icon?: string
  authScope?: string
}

export interface ConnectedMCPService {
  config: MCPServiceConfig
  client: import("./client").MCPClient
  transport: import("./transport").StreamableHTTPTransport
  provider: SecureStoreOAuthClientProvider
}

export interface OAuthClientMetadata {
  redirect_uris: string[]
  token_endpoint_auth_method?: string
  grant_types?: string[]
  response_types?: string[]
  client_name?: string
  client_uri?: string
  logo_uri?: string
  scope?: string
  contacts?: string[]
  tos_uri?: string
  policy_uri?: string
  jwks_uri?: string
  jwks?: unknown
  software_id?: string
  software_version?: string
  software_statement?: string
}

export interface OAuthClientInformation {
  client_id: string
  client_secret?: string
  client_id_issued_at?: number
  client_secret_expires_at?: number
}

export interface OAuthTokens {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  id_token?: string
}

export interface OAuthDiscoveryState {
  authorizationServerUrl: string
  authorizationServerMetadata?: Record<string, unknown>
  resourceMetadata?: Record<string, unknown>
  resourceMetadataUrl?: string
}
