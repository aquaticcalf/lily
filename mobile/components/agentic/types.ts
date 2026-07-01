export type AgentRole = "user" | "assistant" | "system"

export type AgentRunStatus = "idle" | "submitted" | "streaming" | "waiting" | "completed" | "failed"

export type ToolStatus =
  | "queued"
  | "running"
  | "needs_approval"
  | "approved"
  | "denied"
  | "completed"
  | "failed"

export type PermissionRisk = "low" | "medium" | "high"

export interface AgentAttachment {
  id: string
  name: string
  kind?: "image" | "file" | "audio" | "link"
  detail?: string
}

export interface AgentMessageModel {
  id: string
  role: AgentRole
  text: string
  createdAt?: string
  status?: AgentRunStatus
  attachments?: AgentAttachment[]
  toolCall?: ToolCallModel
}

export interface ToolCallModel {
  id: string
  name: string
  title?: string
  status: ToolStatus
  summary?: string
  input?: unknown
  output?: unknown
  error?: string
  startedAt?: string
}

export interface PermissionRequestModel {
  id: string
  title: string
  description: string
  toolName?: string
  risk?: PermissionRisk
  scopes?: string[]
  destructive?: boolean
}

export interface AgentSuggestion {
  id: string
  label: string
  prompt: string
}
