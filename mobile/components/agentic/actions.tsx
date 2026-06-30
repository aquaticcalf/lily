import { Pressable, ScrollView, View } from "react-native"
import { withUniwind } from "uniwind"
import {
  AgentBadge,
  AgentButton,
  AgentText,
  Divider,
  KeyValueRow,
  StatusDot,
  Surface,
  joinClasses,
} from "./primitives"
import type { PermissionRequestModel, ToolCallModel, ToolStatus } from "./types"

const StyledView = withUniwind(View)
const StyledScrollView = withUniwind(ScrollView)
const StyledPressable = withUniwind(Pressable)

function toolTone(status: ToolStatus): "neutral" | "info" | "success" | "warning" | "danger" {
  if (status === "completed" || status === "approved") return "success"
  if (status === "needs_approval" || status === "queued") return "warning"
  if (status === "failed" || status === "denied") return "danger"
  if (status === "running") return "info"
  return "neutral"
}

function toolLabel(status: ToolStatus) {
  if (status === "needs_approval") return "needs approval"
  return status.replace("_", " ")
}

function stringify(value: unknown) {
  if (value === undefined || value === null || value === "") return null
  if (typeof value === "string") return value

  const cache = new Set()
  try {
    return JSON.stringify(
      value,
      (key, val) => {
        if (typeof val === "object" && val !== null) {
          if (cache.has(val)) {
            return "[Circular]"
          }
          cache.add(val)
        }
        if (typeof val === "bigint") {
          return val.toString() + "n"
        }
        return val
      },
      2,
    )
  } catch (e) {
    return `[Unserializable: ${e instanceof Error ? e.message : String(e)}]`
  }
}

export function ToolCallCard({
  tool,
  expanded,
  onToggle,
}: {
  tool: ToolCallModel
  expanded?: boolean
  onToggle?: () => void
}) {
  const input = stringify(tool.input)
  const output = stringify(tool.output)

  return (
    <Surface className="gap-3">
      <StyledPressable accessibilityRole="button" className="gap-2" onPress={onToggle}>
        <StyledView className="flex-row items-start justify-between gap-3">
          <StyledView className="min-w-0 flex-1 gap-1">
            <StyledView className="flex-row items-center gap-2">
              <StatusDot status={tool.status} />
              <AgentText className="text-base" weight="bold">
                {tool.title ?? tool.name}
              </AgentText>
            </StyledView>
            {tool.summary ? (
              <AgentText className="text-sm" tone="muted">
                {tool.summary}
              </AgentText>
            ) : null}
          </StyledView>
          <AgentBadge tone={toolTone(tool.status)}>{toolLabel(tool.status)}</AgentBadge>
        </StyledView>
      </StyledPressable>
      {expanded ? (
        <StyledView className="gap-3">
          <Divider />
          <KeyValueRow
            label="tool"
            value={
              <AgentText className="text-xs text-right" weight="semibold">
                {tool.name}
              </AgentText>
            }
          />
          {tool.startedAt ? (
            <KeyValueRow
              label="started"
              value={
                <AgentText className="text-xs text-right" tone="muted">
                  {tool.startedAt}
                </AgentText>
              }
            />
          ) : null}
          {input ? <JsonBlock label="input" value={input} /> : null}
          {output ? <JsonBlock label="output" value={output} /> : null}
          {tool.error ? <JsonBlock danger label="error" value={tool.error} /> : null}
        </StyledView>
      ) : null}
    </Surface>
  )
}

export function JsonBlock({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <StyledView className="gap-2">
      <AgentText
        className="text-xs uppercase tracking-wide"
        tone={danger ? "danger" : "muted"}
        weight="semibold"
      >
        {label}
      </AgentText>
      <StyledScrollView
        className={joinClasses(
          "max-h-44 rounded-lg px-3 py-2",
          danger ? "bg-agent-danger-subtle" : "bg-muted",
        )}
        horizontal
      >
        <AgentText className="font-mono text-xs leading-5" tone={danger ? "danger" : "default"}>
          {value}
        </AgentText>
      </StyledScrollView>
    </StyledView>
  )
}

export function PermissionCard({
  request,
  onApprove,
  onDeny,
  busy,
}: {
  request: PermissionRequestModel
  onApprove?: (request: PermissionRequestModel) => void
  onDeny?: (request: PermissionRequestModel) => void
  busy?: boolean
}) {
  const risk = request.risk ?? (request.destructive ? "high" : "medium")

  return (
    <Surface
      className={joinClasses(
        "gap-4",
        risk === "high" && "border-agent-danger",
        risk === "medium" && "border-agent-warning",
      )}
    >
      <StyledView className="gap-2">
        <StyledView className="flex-row items-center justify-between gap-3">
          <StyledView className="flex-row items-center gap-2">
            <StatusDot status={risk} />
            <AgentText weight="bold">{request.title}</AgentText>
          </StyledView>
          <AgentBadge tone={risk === "high" ? "danger" : risk === "medium" ? "warning" : "neutral"}>
            {risk} risk
          </AgentBadge>
        </StyledView>
        <AgentText className="text-sm" tone="muted">
          {request.description}
        </AgentText>
      </StyledView>
      {request.toolName || request.scopes?.length ? (
        <StyledView className="gap-2">
          <Divider />
          {request.toolName ? (
            <KeyValueRow
              label="tool"
              value={
                <AgentText className="text-xs text-right" weight="semibold">
                  {request.toolName}
                </AgentText>
              }
            />
          ) : null}
          {request.scopes?.length ? <ScopeList scopes={request.scopes} /> : null}
        </StyledView>
      ) : null}
      <StyledView className="flex-row gap-2">
        <AgentButton
          className="flex-1"
          disabled={busy}
          label="deny"
          onPress={() => onDeny?.(request)}
          tone="secondary"
        />
        <AgentButton
          className="flex-1"
          label="approve"
          loading={busy}
          onPress={() => onApprove?.(request)}
          tone={request.destructive ? "danger" : "primary"}
        />
      </StyledView>
    </Surface>
  )
}

export function ScopeList({ scopes }: { scopes: string[] }) {
  return (
    <StyledView className="flex-row flex-wrap gap-2">
      {scopes.map((scope) => (
        <AgentBadge key={scope} tone="neutral">
          {scope}
        </AgentBadge>
      ))}
    </StyledView>
  )
}

export function AuthorizationPrompt({
  provider,
  description,
  onOpen,
  onCancel,
}: {
  provider: string
  description?: string
  onOpen?: () => void
  onCancel?: () => void
}) {
  return (
    <Surface className="gap-4">
      <StyledView className="gap-2">
        <StyledView className="flex-row items-center gap-2">
          <StatusDot status="waiting" />
          <AgentText weight="bold">connect {provider}</AgentText>
        </StyledView>
        <AgentText className="text-sm" tone="muted">
          {description ?? "lily needs your permission before it can use this connection."}
        </AgentText>
      </StyledView>
      <StyledView className="flex-row gap-2">
        <AgentButton className="flex-1" label="not now" onPress={onCancel} tone="secondary" />
        <AgentButton className="flex-1" label="sign in" onPress={onOpen} tone="primary" />
      </StyledView>
    </Surface>
  )
}

export function ReasoningCard({
  title = "working notes",
  text,
  open,
  onToggle,
}: {
  title?: string
  text: string
  open?: boolean
  onToggle?: () => void
}) {
  return (
    <Surface className="gap-3">
      <StyledPressable
        accessibilityRole="button"
        className="flex-row items-center justify-between gap-3"
        onPress={onToggle}
      >
        <StyledView className="flex-row items-center gap-2">
          <StatusDot status="streaming" />
          <AgentText weight="bold">{title}</AgentText>
        </StyledView>
        <AgentText className="text-sm" tone="muted">
          {open ? "hide" : "show"}
        </AgentText>
      </StyledPressable>
      {open ? (
        <>
          <Divider />
          <AgentText className="text-sm" tone="muted">
            {text}
          </AgentText>
        </>
      ) : null}
    </Surface>
  )
}

export function TaskChecklist({
  items,
}: {
  items: Array<{ id: string; label: string; done?: boolean; active?: boolean }>
}) {
  return (
    <Surface className="gap-3">
      <AgentText weight="bold">task plan</AgentText>
      <StyledView className="gap-2">
        {items.map((item) => (
          <StyledView className="flex-row items-center gap-3" key={item.id}>
            <StyledView
              className={joinClasses(
                "h-5 w-5 items-center justify-center rounded-full border",
                item.done
                  ? "border-agent-success bg-agent-success"
                  : item.active
                    ? "border-agent-info bg-agent-info-subtle"
                    : "border-border",
              )}
            >
              {item.done ? (
                <AgentText className="text-xs leading-4" tone="inverse" weight="bold">
                  ✓
                </AgentText>
              ) : null}
            </StyledView>
            <AgentText
              className={joinClasses("flex-1 text-sm", item.done && "line-through")}
              tone={item.done ? "muted" : "default"}
            >
              {item.label}
            </AgentText>
          </StyledView>
        ))}
      </StyledView>
    </Surface>
  )
}
