import { useState } from "react"
import { View, ActivityIndicator, ScrollView } from "react-native"
import { withUniwind } from "uniwind"
import { connectService, disconnectService } from "../services/mcp/client"
import type { ConnectedMCPService } from "../services/mcp/types"
import { AgentText, AgentButton } from "./agentic/primitives"

const StyledView = withUniwind(View)
const StyledScrollView = withUniwind(ScrollView)

const SERVICES = [
  { id: "swiggy-food", name: "Swiggy Food", serverUrl: "https://mcp.swiggy.com/food" },
  { id: "swiggy-im", name: "Instamart", serverUrl: "https://mcp.swiggy.com/im" },
]

export default function McpTest() {
  const [connections, setConnections] = useState<Record<string, ConnectedMCPService>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tools, setTools] = useState<Record<string, string[]>>({})

  async function handleConnect(id: string, serverUrl: string) {
    setLoading(id)
    setError(null)
    try {
      const connected = await connectService({ id, name: id, serverUrl })
      setConnections((prev) => ({ ...prev, [id]: connected }))
      const result = await connected.client.listTools()
      setTools((prev) => ({ ...prev, [id]: result.tools.map((t) => t.name) }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(null)
    }
  }

  async function handleDisconnect(id: string) {
    const conn = connections[id]
    if (!conn) return
    await disconnectService(conn)
    setConnections((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setTools((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <StyledScrollView className="flex-1 bg-background px-4 pt-16">
      <AgentText className="text-2xl font-bold mb-6">MCP Test</AgentText>

      {SERVICES.map((svc) => {
        const isConnected = !!connections[svc.id]
        const isLoading = loading === svc.id
        const svcTools = tools[svc.id]

        return (
          <StyledView key={svc.id} className="mb-4 rounded-xl border border-border bg-card p-4">
            <StyledView className="flex-row items-center justify-between mb-2">
              <AgentText weight="bold">{svc.name}</AgentText>
              <StyledView
                className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-gray-400"}`}
              />
            </StyledView>

            <AgentText className="text-xs mb-3" tone="muted">
              {svc.serverUrl}
            </AgentText>

            {isLoading ? (
              <ActivityIndicator />
            ) : isConnected ? (
              <>
                <AgentButton
                  label="Disconnect"
                  onPress={() => handleDisconnect(svc.id)}
                  size="sm"
                  tone="danger"
                />
                {svcTools && (
                  <StyledView className="mt-3">
                    <AgentText className="text-xs font-semibold mb-1">Tools:</AgentText>
                    {svcTools.map((t) => (
                      <AgentText key={t} className="text-xs ml-2" tone="muted">
                        • {t}
                      </AgentText>
                    ))}
                  </StyledView>
                )}
              </>
            ) : (
              <AgentButton
                label="Connect"
                onPress={() => handleConnect(svc.id, svc.serverUrl)}
                size="sm"
                tone="primary"
              />
            )}
          </StyledView>
        )
      })}

      {error && (
        <StyledView className="rounded-xl border border-red-500 bg-red-50 p-3 mb-4">
          <AgentText className="text-red-600 text-xs">{error}</AgentText>
        </StyledView>
      )}
    </StyledScrollView>
  )
}
