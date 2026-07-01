import { useCallback, useRef, useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { ShieldQuestion } from "lucide-react-native"
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
import { sendEveMessage } from "../../api/eve"
import { useAuth } from "../../auth"

interface InputRequest {
  requestId: string
  prompt: string
  action: {
    toolName: string
    input: any
  }
}

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

function now() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

export function AgenticDemo() {
  const { idToken } = useAuth()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<AgentMessageModel[]>([])

  // Track live state from the stream
  const [agentStatus, setAgentStatus] = useState<AgentRunStatus>("idle")
  const [subtitle, setSubtitle] = useState("ready")
  const [activeToolName, setActiveToolName] = useState<string | undefined>()
  const [toolCalls, setToolCalls] = useState<ToolCallModel[]>([])

  // Track permissions and session
  const [pendingRequests, setPendingRequests] = useState<InputRequest[]>([])
  const [permBusy, setPermBusy] = useState(false)
  const [toolOpenId, setToolOpenId] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)

  // A unique run ID to avoid async race conditions on reset
  const runRef = useRef(0)

  const addMessage = useCallback((msg: Omit<AgentMessageModel, "id" | "createdAt">) => {
    setMessages((prev) => {
      // If the last message is from the assistant and is streaming, we just append to it (unless we want to create a new one, but for simplicity we append)
      const last = prev[prev.length - 1]
      if (
        last &&
        last.role === msg.role &&
        msg.role === "assistant" &&
        msg.status === "streaming"
      ) {
        return [...prev.slice(0, -1), { ...last, text: last.text + msg.text }]
      }
      return [...prev, { ...msg, id: `m-${Date.now()}-${Math.random()}`, createdAt: now() }]
    })
  }, [])

  const markAssistantCompleted = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === "assistant") {
        return [...prev.slice(0, -1), { ...last, status: "completed" }]
      }
      return prev
    })
  }, [])

  const startRun = useCallback(
    async (userText: string) => {
      const run = ++runRef.current
      const alive = () => run === runRef.current

      addMessage({ role: "user", text: userText })

      const currentSessionId =
        sessionId ||
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      if (!sessionId) setSessionId(currentSessionId)

      setAgentStatus("streaming")
      setSubtitle("thinking…")

      try {
        const stream = sendEveMessage(userText, idToken, currentSessionId)

        for await (const event of stream) {
          if (!alive()) break

          if (event.type === "message.appended") {
            setSubtitle("writing…")
            addMessage({ role: "assistant", text: event.data.messageDelta, status: "streaming" })
          } else if (event.type === "message.completed") {
            markAssistantCompleted()
          } else if (event.type === "actions.requested") {
            setAgentStatus("submitted")
            setSubtitle("running tool")
            const toolCall = event.data.actions[0]
            if (toolCall && toolCall.kind === "tool-call") {
              setActiveToolName(toolCall.toolName)
              setToolCalls((prev) => [
                ...prev,
                {
                  id: toolCall.callId,
                  name: toolCall.toolName,
                  title: toolCall.toolName,
                  status: "running",
                  input: toolCall.input,
                },
              ])
            }
          } else if (event.type === "action.result") {
            setAgentStatus("streaming")
            setSubtitle("thinking…")
            setActiveToolName(undefined)
            const resultCallId = event.data.result.callId
            setToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === resultCallId
                  ? {
                      ...tc,
                      status: "completed",
                      output: event.data.result.output,
                    }
                  : tc,
              ),
            )
            // Auto open the last tool call
            setToolOpenId(resultCallId)
          } else if (event.type === "input.requested") {
            setAgentStatus("waiting")
            setSubtitle("waiting for permission")
            setPendingRequests([...event.data.requests])
          } else if (event.type === "turn.completed" || event.type === "turn.failed") {
            setAgentStatus("idle")
            setSubtitle(event.type === "turn.failed" ? "failed" : "ready")
          }
        }
      } catch {
        setSubtitle("error occurred")
        setAgentStatus("failed")
      }
    },
    [addMessage, markAssistantCompleted, sessionId, idToken],
  )

  const approvePermission = useCallback(async () => {
    if (!sessionId || pendingRequests.length === 0) return

    setPermBusy(true)
    try {
      const stream = sendEveMessage(
        "Proceed.",
        idToken,
        sessionId,
        pendingRequests.map((r) => ({
          requestId: r.requestId,
          optionId: "approve",
        })),
      )

      setPermBusy(false)
      setPendingRequests([])
      setAgentStatus("streaming")
      setSubtitle("resuming…")

      for await (const event of stream) {
        if (event.type === "message.appended") {
          setSubtitle("writing…")
          addMessage({ role: "assistant", text: event.data.messageDelta, status: "streaming" })
        } else if (event.type === "message.completed") {
          markAssistantCompleted()
        } else if (event.type === "actions.requested") {
          setAgentStatus("submitted")
          setSubtitle("running tool")
          const toolCall = event.data.actions[0]
          if (toolCall && toolCall.kind === "tool-call") {
            setActiveToolName(toolCall.toolName)
            setToolCalls((prev) => [
              ...prev,
              {
                id: toolCall.callId,
                name: toolCall.toolName,
                title: toolCall.toolName,
                status: "running",
                input: toolCall.input,
              },
            ])
          }
        } else if (event.type === "action.result") {
          setAgentStatus("streaming")
          setSubtitle("thinking…")
          setActiveToolName(undefined)
          const resultCallId = event.data.result.callId
          setToolCalls((prev) =>
            prev.map((tc) =>
              tc.id === resultCallId
                ? {
                    ...tc,
                    status: "completed",
                    output: event.data.result.output,
                  }
                : tc,
            ),
          )
          setToolOpenId(resultCallId)
        } else if (event.type === "input.requested") {
          setAgentStatus("waiting")
          setSubtitle("waiting for permission")
          setPendingRequests([...event.data.requests])
        } else if (event.type === "turn.completed" || event.type === "turn.failed") {
          setAgentStatus("idle")
          setSubtitle(event.type === "turn.failed" ? "failed" : "ready")
        }
      }
    } catch {
      setPermBusy(false)
      setAgentStatus("failed")
      setSubtitle("error occurred")
    }
  }, [addMessage, markAssistantCompleted, pendingRequests, sessionId, idToken])

  function submitMessage() {
    const text = input.trim()
    if (!text) return
    setInput("")
    void startRun(text)
  }

  function resetDemo() {
    runRef.current++
    setMessages([])
    setToolCalls([])
    setPendingRequests([])
    setAgentStatus("idle")
    setSubtitle("ready")
    setPermBusy(false)
    setToolOpenId(null)
    setSessionId(null)
  }

  const showSuggestions = agentStatus === "idle" && messages.length === 0

  // only show the ONE thing that matters right now
  const footer = (() => {
    if (pendingRequests.length > 0) {
      const request = pendingRequests[0]
      return (
        <View className="mb-4 overflow-hidden rounded-xl bg-violet-50 dark:bg-violet-950/20">
          <View className="flex-row items-center border-b border-violet-100 p-4 dark:border-violet-900/50">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
              <ShieldQuestion size={16} className="text-violet-600 dark:text-violet-400" />
            </View>
            <Text className="text-base font-medium text-violet-900 dark:text-violet-100">
              Permission Requested
            </Text>
          </View>
          <View className="p-4">
            <Text className="mb-2 text-sm font-medium text-violet-800 dark:text-violet-200">
              Agent wants to {request.action.toolName}
            </Text>
            <Text className="mb-4 text-sm text-violet-600 dark:text-violet-400">
              {request.prompt || "The agent is requesting permission to proceed."}
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity className="rounded-lg px-4 py-2 opacity-50" disabled={permBusy}>
                <Text className="font-medium text-violet-700 dark:text-violet-300">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={approvePermission}
                disabled={permBusy}
                className={`rounded-lg bg-violet-600 px-4 py-2 ${permBusy ? "opacity-50" : ""}`}
              >
                <Text className="font-medium text-white">Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    }

    if (activeToolName) {
      return <RunStatusBar activeTool={activeToolName} status={agentStatus} />
    }

    if (toolCalls.length > 0 && agentStatus !== "streaming") {
      const lastTool = toolCalls[toolCalls.length - 1]
      return (
        <ToolCallCard
          expanded={toolOpenId === lastTool.id}
          onToggle={() => setToolOpenId((v) => (v === lastTool.id ? null : lastTool.id))}
          tool={lastTool}
        />
      )
    }

    return null
  })()

  return (
    <AgentScreenFrame
      rightSlot={
        agentStatus === "idle" && messages.length > 0 ? (
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
