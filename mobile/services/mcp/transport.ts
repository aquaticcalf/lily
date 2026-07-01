import type { JSONRPCMessage, Transport } from "./types"
import { isInitializedNotification } from "./types"

function base64Encode(data: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let result = ""
  const bytes = new TextEncoder().encode(data)
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0
    result += chars[b1 >> 2]
    result += chars[((b1 & 3) << 4) | (b2 >> 4)]
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "="
    result += i + 2 < bytes.length ? chars[b3 & 63] : "="
  }
  return result
}

export function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${base64Encode(`${clientId}:${clientSecret}`)}`
}

export function base64URLEncode(buffer: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  let result = ""
  for (let i = 0; i < buffer.length; i += 3) {
    const b1 = buffer[i]
    const b2 = i + 1 < buffer.length ? buffer[i + 1] : 0
    const b3 = i + 2 < buffer.length ? buffer[i + 2] : 0
    result += chars[b1 >> 2]
    result += chars[((b1 & 3) << 4) | (b2 >> 4)]
    result += i + 1 < buffer.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : ""
    result += i + 2 < buffer.length ? chars[b3 & 63] : ""
  }
  return result
}

function createSSEParser(
  onEvent: (event: { data?: string; event?: string; id?: string }) => void,
  onRetry?: (ms: number) => void,
) {
  let buffer = ""

  return {
    feed(chunk: string) {
      buffer += chunk
      const parts = buffer.split("\n\n")
      buffer = parts.pop() ?? ""

      for (const part of parts) {
        if (!part.trim()) continue

        const event: { data?: string; event?: string; id?: string } = {}
        const dataLines: string[] = []

        for (const line of part.split("\n")) {
          if (line.startsWith("data:")) {
            dataLines.push(line[5] === " " ? line.slice(6) : line.slice(5))
          } else if (line.startsWith("event:")) {
            event.event = line[6] === " " ? line.slice(7) : line.slice(6)
          } else if (line.startsWith("id:")) {
            event.id = line[3] === " " ? line.slice(4) : line.slice(3)
          } else if (line.startsWith("retry:")) {
            const val = line[6] === " " ? line.slice(7).trim() : line.slice(6).trim()
            onRetry?.(parseInt(val, 10))
          }
        }

        if (dataLines.length > 0) {
          event.data = dataLines.join("\n")
        }

        if (event.data !== undefined) {
          onEvent(event)
        }
      }
    },
    reset() {
      buffer = ""
    },
  }
}

export class StreamableHTTPTransport implements Transport {
  private _url: URL
  private _authProvider?: import("./provider").SecureStoreOAuthClientProvider
  private _sessionId?: string
  private _protocolVersion?: string
  private _abortController?: AbortController
  private _sseAbortController?: AbortController
  private _hasCompletedAuthFlow = false

  onmessage?: (message: JSONRPCMessage) => void
  onerror?: (error: Error) => void
  onclose?: () => void

  constructor(
    url: string | URL,
    opts?: {
      authProvider?: import("./provider").SecureStoreOAuthClientProvider
      sessionId?: string
    },
  ) {
    this._url = typeof url === "string" ? new URL(url) : url
    this._authProvider = opts?.authProvider
    this._sessionId = opts?.sessionId
  }

  get sessionId(): string | undefined {
    return this._sessionId
  }

  setProtocolVersion(version: string): void {
    this._protocolVersion = version
  }

  async start(): Promise<void> {
    this._abortController = new AbortController()
  }

  private async _getAuthToken(): Promise<string | undefined> {
    const tokens = await this._authProvider?.tokens()
    return tokens?.access_token
  }

  private _buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (this._sessionId) {
      headers["mcp-session-id"] = this._sessionId
    }
    if (this._protocolVersion) {
      headers["mcp-protocol-version"] = this._protocolVersion
    }
    return headers
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._abortController) {
      throw new Error("Transport not started")
    }

    try {
      await this._sendInternal(message)
    } catch (error) {
      this.onerror?.(error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  private async _sendInternal(message: JSONRPCMessage): Promise<void> {
    const headers = this._buildHeaders()
    headers["content-type"] = "application/json"
    headers["accept"] = "application/json, text/event-stream"

    const body = JSON.stringify(message)
    const urlStr = this._url.toString()

    const token = await this._getAuthToken()
    if (token) {
      headers["authorization"] = `Bearer ${token}`
    }

    const response = await fetch(urlStr, {
      method: "POST",
      headers,
      body,
      signal: this._abortController?.signal,
    })

    const sessionId = response.headers.get("mcp-session-id")
    if (sessionId) {
      this._sessionId = sessionId
    }

    if (response.status === 202) {
      await response.body?.cancel()
      if (isInitializedNotification(message)) {
        this._startSSEStream()
      }
      return
    }

    if (!response.ok) {
      if (response.status === 401 && this._authProvider) {
        if (this._hasCompletedAuthFlow) {
          throw new Error("Server returned 401 after successful authentication")
        }
        await this._handleAuth()
        this._hasCompletedAuthFlow = true
        return this._sendInternal(message)
      }
      const text = await response.text().catch(() => null)
      throw new Error(`HTTP ${response.status}: ${text || response.statusText}`)
    }

    this._hasCompletedAuthFlow = false

    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("text/event-stream")) {
      if (response.body && typeof response.body.getReader === "function") {
        this._readSSEStream(response.body)
      } else {
        const text = await response.text()
        if (text) {
          this._parseSSEText(text)
        }
      }
    } else if (contentType.includes("application/json")) {
      const data = await response.json()
      const messages = Array.isArray(data) ? data : [data]
      for (const msg of messages) {
        this.onmessage?.(msg as JSONRPCMessage)
      }
    } else {
      await response.body?.cancel()
    }
  }

  private _startSSEStream(): void {
    if (this._sseAbortController) {
      this._sseAbortController.abort()
    }
    this._sseAbortController = new AbortController()

    void this._openSSEStream()
  }

  private async _openSSEStream(): Promise<void> {
    const headers = this._buildHeaders()
    headers["accept"] = "text/event-stream"

    const token = await this._getAuthToken()
    if (token) {
      headers["authorization"] = `Bearer ${token}`
    }

    const signal = this._sseAbortController!.signal

    const xhr = new XMLHttpRequest()
    xhr.open("GET", this._url.toString())
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v)
    }

    let lastPos = 0
    const parser = createSSEParser((event) => {
      if (!event.data) return
      try {
        const msg = JSON.parse(event.data) as JSONRPCMessage
        this.onmessage?.(msg)
      } catch {
        this.onerror?.(new Error(`Failed to parse SSE data: ${event.data}`))
      }
    })

    xhr.onprogress = () => {
      const newData = xhr.responseText.slice(lastPos)
      lastPos = xhr.responseText.length
      if (newData) {
        parser.feed(newData)
      }
    }

    const onDone = () => {
      const newData = xhr.responseText.slice(lastPos)
      if (newData) {
        parser.feed(newData)
      }
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        onDone()
      } else if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
        const contentType = xhr.getResponseHeader("content-type") || ""
        if (contentType.includes("application/json")) {
          try {
            const data = JSON.parse(xhr.responseText)
            const messages = Array.isArray(data) ? data : [data]
            for (const msg of messages) {
              this.onmessage?.(msg as JSONRPCMessage)
            }
          } catch {}
        }
      }
    }

    xhr.onerror = () => {
      this.onerror?.(new Error("SSE stream network error"))
    }

    signal.addEventListener("abort", () => {
      xhr.abort()
    })

    xhr.send()
  }

  private _readSSEStream(stream: ReadableStream<Uint8Array>): void {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const parser = createSSEParser((event) => {
      if (!event.data) return
      try {
        const msg = JSON.parse(event.data) as JSONRPCMessage
        this.onmessage?.(msg)
      } catch {
        this.onerror?.(new Error(`Failed to parse SSE data: ${event.data}`))
      }
    })

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          parser.feed(decoder.decode(value, { stream: true }))
        }
      } catch (err) {
        this.onerror?.(err instanceof Error ? err : new Error(String(err)))
      }
    }

    void pump()
  }

  private _parseSSEText(text: string): void {
    const parser = createSSEParser((event) => {
      if (!event.data) return
      try {
        const msg = JSON.parse(event.data) as JSONRPCMessage
        this.onmessage?.(msg)
      } catch {
        this.onerror?.(new Error(`Failed to parse SSE data: ${event.data}`))
      }
    })
    parser.feed(text)
  }

  private async _handleAuth(): Promise<void> {
    if (!this._authProvider) {
      throw new Error("No auth provider available for re-authentication")
    }
    const { auth } = await import("./auth")
    await auth(this._authProvider, {
      serverUrl: this._url.toString(),
    })
  }

  async finishAuth(authorizationCode: string): Promise<void> {
    if (!this._authProvider) {
      throw new Error("No auth provider")
    }
    const { auth } = await import("./auth")
    const result = await auth(this._authProvider, {
      serverUrl: this._url.toString(),
      authorizationCode,
    })
    if (result !== "AUTHORIZED") {
      throw new Error("Failed to authorize")
    }
  }

  async close(): Promise<void> {
    this._sseAbortController?.abort()
    this._abortController?.abort()
    this._abortController = undefined
    this._sseAbortController = undefined
    this.onclose?.()
  }
}
