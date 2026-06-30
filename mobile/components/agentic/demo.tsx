import { useCallback, useRef, useState } from "react"
import {
  AgentButton,
  AgentScreenFrame,
  Composer,
  ConversationList,
  PermissionCard,
  RunStatusBar,
  SuggestionRow,
  ToolCallCard,
} from "."
import type {
  AgentMessageModel,
  AgentRunStatus,
  AgentSuggestion,
  PermissionRequestModel,
  ToolCallModel,
} from "./types"

const suggestions: AgentSuggestion[] = [
  {
    id: "inbox",
    label: "scan inbox",
    prompt: "scan my inbox for urgent things, but ask before opening anything private",
  },
  {
    id: "plan",
    label: "make plan",
    prompt: "turn this into a short action plan",
  },
  {
    id: "voice",
    label: "voice brief",
    prompt: "give me the fastest spoken summary",
  },
]

const permission: PermissionRequestModel = {
  id: "gmail-read",
  title: "allow inbox scan",
  description:
    "read up to 10 unread message headers and snippets. no sending, deleting, or marking read.",
  toolName: "gmail.search_messages",
  risk: "medium",
  scopes: ["headers", "snippets", "unread only"],
}

type DemoPhase =
  | "idle"
  | "thinking"
  | "needs_permission"
  | "permission_granted"
  | "tool_running"
  | "summarizing"
  | "done"

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function now() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

export function AgenticDemo() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<AgentMessageModel[]>([])
  const [phase, setPhase] = useState<DemoPhase>("idle")
  const [toolOpen, setToolOpen] = useState(false)
  const [permBusy, setPermBusy] = useState(false)
  const runRef = useRef(0)

  const searchTool: ToolCallModel = {
    id: "tool-search",
    name: "gmail.search_messages",
    title: "gmail search",
    status:
      phase === "tool_running"
        ? "running"
        : phase === "done" || phase === "summarizing"
          ? "completed"
          : "needs_approval",
    summary:
      phase === "tool_running"
        ? "searching unread messages…"
        : phase === "done" || phase === "summarizing"
          ? "found 3 unread threads"
          : "waiting for approval.",
    input: { query: "is:unread newer_than:3d", limit: 10 },
    output:
      phase === "done" || phase === "summarizing"
        ? { threads: 3, urgent: 1, flagged: 2 }
        : undefined,
  }

  const agentStatus: AgentRunStatus =
    phase === "thinking" || phase === "summarizing"
      ? "streaming"
      : phase === "needs_permission"
        ? "waiting"
        : phase === "tool_running" || phase === "permission_granted"
          ? "submitted"
          : phase === "done"
            ? "completed"
            : "idle"

  const subtitle =
    phase === "thinking"
      ? "thinking…"
      : phase === "needs_permission"
        ? "waiting for permission"
        : phase === "tool_running" || phase === "permission_granted"
          ? "running tool"
          : phase === "summarizing"
            ? "writing summary…"
            : phase === "done"
              ? "task complete"
              : "ready"

  const addMessage = useCallback((msg: Omit<AgentMessageModel, "id" | "createdAt">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `m-${Date.now()}-${Math.random()}`, createdAt: now() },
    ])
  }, [])

  const startRun = useCallback(
    async (userText: string) => {
      const run = ++runRef.current
      const alive = () => run === runRef.current

      addMessage({ role: "user", text: userText })
      setPhase("thinking")

      await delay(1200)
      if (!alive()) return

      addMessage({
        role: "assistant",
        text: "checking local context… i can see your calendar is clear this morning. to check gmail i need a narrow read permission first.",
        status: "waiting",
      })
      setPhase("needs_permission")
    },
    [addMessage],
  )

  const approvePermission = useCallback(async () => {
    const run = runRef.current
    const alive = () => run === runRef.current

    setPermBusy(true)
    await delay(500)
    if (!alive()) return

    setPermBusy(false)
    setPhase("permission_granted")

    addMessage({
      role: "assistant",
      text: "permission granted — scanning your inbox now.",
      status: "streaming",
    })

    await delay(400)
    if (!alive()) return
    setPhase("tool_running")

    await delay(2000)
    if (!alive()) return
    setPhase("summarizing")

    addMessage({
      role: "assistant",
      text: "found 3 unread threads. one flagged urgent from ops about a deploy freeze, two FYI newsletters. want me to draft a reply to the ops thread?",
      status: "completed",
    })

    await delay(600)
    if (!alive()) return
    setPhase("done")
  }, [addMessage])

  function submitMessage() {
    const text = input.trim()
    if (!text) return
    setInput("")
    void startRun(text)
  }

  function resetDemo() {
    runRef.current++
    setMessages([])
    setPhase("idle")
    setPermBusy(false)
    setToolOpen(false)
  }

  const showSuggestions = phase === "idle" && messages.length === 0

  // only show the ONE thing that matters right now
  const footer = (() => {
    if (phase === "needs_permission") {
      return (
        <PermissionCard
          busy={permBusy}
          onApprove={approvePermission}
          onDeny={() => {
            setPermBusy(false)
            addMessage({
              role: "assistant",
              text: "no worries — continuing from local context only. anything else?",
            })
            setPhase("done")
          }}
          request={permission}
        />
      )
    }

    if (phase === "tool_running") {
      return <RunStatusBar activeTool="gmail.search_messages" status={agentStatus} />
    }

    if (phase === "done") {
      return (
        <ToolCallCard
          expanded={toolOpen}
          onToggle={() => setToolOpen((v) => !v)}
          tool={searchTool}
        />
      )
    }

    return null
  })()

  return (
    <AgentScreenFrame
      rightSlot={
        phase === "done" ? (
          <AgentButton label="new" onPress={resetDemo} size="sm" tone="ghost" />
        ) : null
      }
      status={agentStatus}
      subtitle={subtitle}
    >
      <ConversationList footer={footer} messages={messages} />

      {showSuggestions ? (
        <SuggestionRow
          onSelect={(s) => {
            setInput("")
            void startRun(s.prompt)
          }}
          suggestions={suggestions}
        />
      ) : null}

      <Composer
        onChangeText={setInput}
        onSubmit={submitMessage}
        placeholder="ask lily to do something..."
        status={agentStatus}
        value={input}
      />
    </AgentScreenFrame>
  )
}
