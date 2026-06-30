import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native"
import type { ReactNode } from "react"
import { useCSSVariable, withUniwind } from "uniwind"
import type { AgentRunStatus, PermissionRisk, ToolStatus } from "./types"

const StyledView = withUniwind(View)
const StyledText = withUniwind(Text)
const StyledPressable = withUniwind(Pressable)

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function AgentText({
  children,
  className,
  tone = "default",
  weight = "regular",
}: {
  children: ReactNode
  className?: string
  tone?: "default" | "muted" | "inverse" | "danger" | "success" | "warning"
  weight?: "regular" | "medium" | "semibold" | "bold"
}) {
  return (
    <StyledText
      className={joinClasses(
        "text-base leading-6",
        tone === "default" && "text-foreground",
        tone === "muted" && "text-muted-foreground",
        tone === "inverse" && "text-primary-foreground",
        tone === "danger" && "text-destructive",
        tone === "success" && "text-success",
        tone === "warning" && "text-warning",
        weight === "medium" && "font-medium",
        weight === "semibold" && "font-semibold",
        weight === "bold" && "font-bold",
        className,
      )}
    >
      {children}
    </StyledText>
  )
}

export function AgentButton({
  children,
  className,
  label,
  loading,
  size = "default",
  tone = "primary",
  ...props
}: PressableProps & {
  children?: ReactNode
  className?: string
  label?: string
  loading?: boolean
  size?: "sm" | "default" | "lg" | "icon"
  tone?: "primary" | "secondary" | "ghost" | "danger" | "success"
}) {
  const inverseText = tone === "primary" || tone === "danger" || tone === "success"

  return (
    <StyledPressable
      accessibilityRole="button"
      className={joinClasses(
        "flex-row items-center justify-center gap-2 rounded-lg",
        size === "sm" && "min-h-9 px-3",
        size === "default" && "min-h-11 px-4",
        size === "lg" && "min-h-12 px-5",
        size === "icon" && "h-11 w-11 px-0",
        tone === "primary" && "bg-primary active:opacity-90",
        tone === "secondary" && "border border-border bg-secondary active:bg-accent",
        tone === "ghost" && "bg-transparent active:bg-accent",
        tone === "danger" && "bg-destructive active:opacity-90",
        tone === "success" && "bg-success active:opacity-90",
        props.disabled && "opacity-50",
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <ActivityIndicator /> : children}
      {label ? (
        <AgentText className="text-sm" tone={inverseText ? "inverse" : "default"} weight="semibold">
          {label}
        </AgentText>
      ) : null}
    </StyledPressable>
  )
}

export function AgentIconButton({
  icon: Icon,
  label,
  active,
  className,
  ...props
}: PressableProps & {
  icon: React.ElementType
  label: string
  active?: boolean
  className?: string
}) {
  const fgColor = useCSSVariable("--foreground") as string
  const primaryFgColor = useCSSVariable("--primary-foreground") as string

  return (
    <AgentButton
      accessibilityLabel={label}
      className={className}
      size="icon"
      tone={active ? "primary" : "secondary"}
      {...props}
    >
      <Icon color={active ? primaryFgColor : fgColor} size={20} />
    </AgentButton>
  )
}

export function Surface({
  children,
  className,
  padded = true,
}: {
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <StyledView
      className={joinClasses("rounded-lg border border-border bg-card", padded && "p-4", className)}
    >
      {children}
    </StyledView>
  )
}

export function StatusDot({
  status,
  className,
}: {
  status: AgentRunStatus | ToolStatus | PermissionRisk
  className?: string
}) {
  return (
    <StyledView
      className={joinClasses(
        "h-2.5 w-2.5 rounded-full",
        (status === "idle" || status === "queued" || status === "low") && "bg-agent-neutral",
        (status === "submitted" || status === "running" || status === "streaming") &&
          "bg-agent-info",
        (status === "waiting" || status === "needs_approval" || status === "medium") &&
          "bg-agent-warning",
        (status === "completed" || status === "approved") && "bg-agent-success",
        (status === "failed" || status === "denied" || status === "high") && "bg-agent-danger",
        className,
      )}
    />
  )
}

export function AgentBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: "neutral" | "info" | "success" | "warning" | "danger"
  className?: string
}) {
  return (
    <StyledView
      className={joinClasses(
        "flex-row items-center rounded-full px-2.5 py-1",
        tone === "neutral" && "bg-muted",
        tone === "info" && "bg-agent-info-subtle",
        tone === "success" && "bg-agent-success-subtle",
        tone === "warning" && "bg-agent-warning-subtle",
        tone === "danger" && "bg-agent-danger-subtle",
        className,
      )}
    >
      <AgentText
        className="text-xs leading-4"
        tone={
          tone === "success"
            ? "success"
            : tone === "warning"
              ? "warning"
              : tone === "danger"
                ? "danger"
                : "muted"
        }
        weight="semibold"
      >
        {children}
      </AgentText>
    </StyledView>
  )
}

export function KeyValueRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <StyledView className="flex-row items-start justify-between gap-3 py-1">
      <AgentText className="text-xs uppercase tracking-wide" tone="muted" weight="semibold">
        {label}
      </AgentText>
      <StyledView className="max-w-[68%] items-end">{value}</StyledView>
    </StyledView>
  )
}

export function Divider({ className }: { className?: string }) {
  return <StyledView className={joinClasses("h-px bg-border", className)} />
}

export { joinClasses }
