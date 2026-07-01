import { useEffect, useRef, type ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from "react-native"
import { ArrowUp, Mic, Square, X } from "lucide-react-native"
import { withUniwind } from "uniwind"
import {
  AgentBadge,
  AgentButton,
  AgentIconButton,
  AgentText,
  StatusDot,
  Surface,
  joinClasses,
} from "./primitives"
import type { AgentAttachment, AgentMessageModel, AgentRunStatus, AgentSuggestion } from "./types"

const StyledView = withUniwind(View)
const StyledScrollView = withUniwind(ScrollView)
const StyledTextInput = withUniwind(TextInput)
const StyledKAV = withUniwind(KeyboardAvoidingView)

function statusLabel(status?: AgentRunStatus) {
  if (!status || status === "idle") return "ready"
  if (status === "submitted") return "queued"
  if (status === "streaming") return "thinking"
  if (status === "waiting") return "waiting"
  if (status === "completed") return "done"
  return "failed"
}

function initials(role: AgentMessageModel["role"]) {
  if (role === "user") return "u"
  if (role === "system") return "s"
  return "l"
}

export function AgentScreenFrame({
  children,
  title = "lily",
  subtitle = "agentic workspace",
  status = "idle",
  rightSlot,
}: {
  children: ReactNode
  title?: string
  subtitle?: string
  status?: AgentRunStatus
  rightSlot?: ReactNode
}) {
  return (
    <StyledKAV
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <StyledView className="bg-background px-4 pb-2 pt-12">
        <StyledView className="flex-row items-center justify-between gap-4">
          <StyledView className="min-w-0 flex-1 flex-row items-center gap-3">
            <StyledView className="h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <AgentText className="text-lg leading-6" tone="inverse" weight="bold">
                l
              </AgentText>
            </StyledView>
            <StyledView className="min-w-0 flex-1">
              <AgentText className="text-lg leading-6" weight="bold">
                {title}
              </AgentText>
              <StyledView className="flex-row items-center gap-2">
                <StatusDot status={status} />
                <AgentText className="text-xs" tone="muted">
                  {subtitle}
                </AgentText>
              </StyledView>
            </StyledView>
          </StyledView>
          {rightSlot}
        </StyledView>
      </StyledView>
      {children}
    </StyledKAV>
  )
}

export function ConversationList({
  messages,
  footer,
  emptyTitle = "what should we make happen?",
  emptyDescription = "start with a request, ask lily to inspect something, or approve a tool when needed.",
}: {
  messages: AgentMessageModel[]
  footer?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
}) {
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages.length, footer])

  return (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 16, gap: 20 }}
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.length === 0 ? (
        <Surface className="items-center gap-2 py-10">
          <AgentText className="text-center text-lg" weight="bold">
            {emptyTitle}
          </AgentText>
          <AgentText className="max-w-[280px] text-center text-sm" tone="muted">
            {emptyDescription}
          </AgentText>
        </Surface>
      ) : (
        messages.map((message) => <AgentMessage key={message.id} message={message} />)
      )}
      {footer}
    </ScrollView>
  )
}

import { ToolCallCard } from "./actions"

export function AgentMessage({ message }: { message: AgentMessageModel }) {
  const isUser = message.role === "user"

  return (
    <StyledView className={joinClasses("flex-row gap-3", isUser && "justify-end")}>
      {!isUser ? <MessageAvatar role={message.role} /> : null}
      <StyledView className={joinClasses("max-w-[82%] gap-2", isUser && "items-end")}>
        {message.toolCall ? (
          <ToolCallCard tool={message.toolCall} expanded={true} />
        ) : message.text ? (
          <StyledView
            className={joinClasses(
              "rounded-lg px-4 py-3",
              isUser ? "bg-primary" : "border border-border bg-card",
            )}
          >
            <AgentText className="text-[15px]" tone={isUser ? "inverse" : "default"}>
              {message.text}
            </AgentText>
          </StyledView>
        ) : null}
        {message.attachments?.length ? <AttachmentStrip attachments={message.attachments} /> : null}
        <StyledView className="flex-row items-center gap-2">
          {message.status ? (
            <>
              <StatusDot status={message.status} />
              <AgentText className="text-xs" tone="muted">
                {statusLabel(message.status)}
              </AgentText>
            </>
          ) : null}
          {message.createdAt ? (
            <AgentText className="text-xs" tone="muted">
              {message.createdAt}
            </AgentText>
          ) : null}
        </StyledView>
      </StyledView>
      {isUser ? <MessageAvatar role={message.role} /> : null}
    </StyledView>
  )
}

export function MessageAvatar({ role }: { role: AgentMessageModel["role"] }) {
  return (
    <StyledView
      className={joinClasses(
        "h-8 w-8 items-center justify-center rounded-lg",
        role === "assistant" && "bg-agent-success-subtle",
        role === "user" && "bg-secondary",
        role === "system" && "bg-agent-warning-subtle",
      )}
    >
      <AgentText className="text-sm" weight="bold">
        {initials(role)}
      </AgentText>
    </StyledView>
  )
}

export function AttachmentStrip({ attachments }: { attachments: AgentAttachment[] }) {
  return (
    <StyledView className="flex-row flex-wrap gap-2">
      {attachments.map((item) => (
        <StyledView
          className="max-w-[220px] rounded-lg border border-border bg-muted px-3 py-2"
          key={item.id}
        >
          <AgentText className="text-xs" weight="semibold">
            {item.name}
          </AgentText>
          {item.detail ? (
            <AgentText className="text-xs" tone="muted">
              {item.detail}
            </AgentText>
          ) : null}
        </StyledView>
      ))}
    </StyledView>
  )
}

export function SuggestionRow({
  suggestions,
  onSelect,
}: {
  suggestions: AgentSuggestion[]
  onSelect?: (suggestion: AgentSuggestion) => void
}) {
  if (!suggestions.length) return null

  return (
    <StyledScrollView
      className="max-h-12"
      contentContainerClassName="gap-2 px-4 pb-1"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {suggestions.map((suggestion) => (
        <AgentButton
          key={suggestion.id}
          label={suggestion.label}
          onPress={() => onSelect?.(suggestion)}
          size="sm"
          tone="secondary"
        />
      ))}
    </StyledScrollView>
  )
}

export function Composer({
  value,
  onChangeText,
  onSubmit,
  onStop,
  status = "idle",
  placeholder = "message lily...",
  talkActive,
  onToggleTalk,
  leftSlot,
}: {
  value: string
  onChangeText: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  status?: AgentRunStatus
  placeholder?: string
  talkActive?: boolean
  onToggleTalk?: () => void
  leftSlot?: ReactNode
}) {
  const busy = status === "submitted" || status === "streaming"

  function handleSubmitEditing(event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) {
    if (event.nativeEvent.text.trim().length > 0 && !busy) onSubmit()
  }

  return (
    <StyledView className="bg-background px-4 pb-6 pt-2">
      <StyledView className="gap-2 rounded-xl border border-border bg-card p-2">
        <StyledView className="min-h-11 rounded-lg bg-input px-3 py-2">
          <StyledTextInput
            className="max-h-28 min-h-7 text-base leading-6 text-foreground"
            multiline
            onChangeText={onChangeText}
            onSubmitEditing={handleSubmitEditing}
            placeholder={placeholder}
            placeholderTextColor="#888"
            textAlignVertical="top"
            value={value}
          />
        </StyledView>
        <StyledView className="flex-row items-center justify-between gap-2">
          <StyledView className="min-w-0 flex-1 flex-row items-center gap-2">
            {leftSlot}
            <StatusDot status={status} />
            <AgentText className="text-xs" tone="muted">
              {statusLabel(status)}
            </AgentText>
          </StyledView>
          {onToggleTalk ? (
            <AgentIconButton
              active={talkActive}
              label={talkActive ? "Stop talking" : "Talk"}
              onPress={onToggleTalk}
              icon={talkActive ? X : Mic}
            />
          ) : null}
          <AgentIconButton
            disabled={!busy && value.trim().length === 0}
            label={busy ? "Stop" : "Send"}
            onPress={busy && onStop ? onStop : onSubmit}
            icon={busy ? Square : ArrowUp}
          />
        </StyledView>
      </StyledView>
    </StyledView>
  )
}

export function TalkPanel({
  active,
  transcript,
  onToggle,
  level = 34,
}: {
  active: boolean
  transcript?: string
  onToggle?: () => void
  level?: number
}) {
  return (
    <Surface className="gap-3">
      <StyledView className="flex-row items-center justify-between gap-3">
        <StyledView className="min-w-0 flex-1">
          <StyledView className="flex-row items-center gap-2">
            <StatusDot status={active ? "streaming" : "idle"} />
            <AgentText weight="bold">talk mode</AgentText>
          </StyledView>
          <AgentText className="text-sm" tone="muted">
            {active ? "listening for your next instruction" : "tap to start a voice turn"}
          </AgentText>
        </StyledView>
        <AgentButton
          label={active ? "stop" : "talk"}
          onPress={onToggle}
          tone={active ? "danger" : "primary"}
        />
      </StyledView>
      <StyledView className="h-2 overflow-hidden rounded-full bg-muted">
        <StyledView
          className="h-full rounded-full bg-agent-success"
          style={{ width: `${Math.max(8, Math.min(100, level))}%` }}
        />
      </StyledView>
      {transcript ? <AgentText className="text-sm">{transcript}</AgentText> : null}
    </Surface>
  )
}

export function RunStatusBar({
  status,
  activeTool,
}: {
  status: AgentRunStatus
  activeTool?: string
}) {
  return (
    <StyledView className="flex-row items-center justify-between rounded-lg bg-muted px-3 py-2">
      <StyledView className="flex-row items-center gap-2">
        <StatusDot status={status} />
        <AgentText className="text-sm" weight="semibold">
          {statusLabel(status)}
        </AgentText>
      </StyledView>
      {activeTool ? <AgentBadge tone="info">{activeTool}</AgentBadge> : null}
    </StyledView>
  )
}
