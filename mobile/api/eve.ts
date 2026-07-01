import { appConfig } from "../config"
import { client } from "./client"

/**
 * A lightweight NDJSON fetch client for Eve.
 * We deliberately use a custom XMLHttpRequest generator instead of Axios here.
 * While Axios 1.5+ added a fetch adapter that technically supports responseType: "stream",
 * it relies on feature-detecting ReadableStream via `new Response('').body`, which
 * often fails or falls back to fully buffering the response on React Native's Metro/Hermes.
 * Using raw XHR onprogress guarantees true chunked streaming across all RN versions.
 */
export async function* sendEveMessage(
  message: string,
  token?: string | null,
  sessionId?: string,
  inputResponses?: any[],
) {
  const url = sessionId 
    ? `${appConfig.url}session/${encodeURIComponent(sessionId)}`
    : `${appConfig.url}session`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/x-ndjson",
  }

  // Try to use the central client's Authorization header if we don't have one explicitly
  let authHeader = token ? `Bearer ${token}` : client.defaults.headers.common["Authorization"]
  if (authHeader) {
    headers["Authorization"] = authHeader.toString()
  }

  const body = JSON.stringify({
    message,
    ...(inputResponses && inputResponses.length > 0 ? { inputResponses } : {}),
  })

  const streamEvents = async function* () {
    let xhr = new XMLHttpRequest()
    xhr.open("POST", url, true)
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v)
    }

    let seenBytes = 0
    let buffer = ""
    let done = false
    let resolveNext: (() => void) | null = null
    let rejectNext: ((err: any) => void) | null = null

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(seenBytes)
      seenBytes = xhr.responseText.length
      buffer += newText
      if (resolveNext && buffer.includes("\n")) {
        resolveNext()
      }
    }

    xhr.onload = () => {
      const newText = xhr.responseText.substring(seenBytes)
      seenBytes = xhr.responseText.length
      buffer += newText
      done = true
      if (resolveNext) resolveNext()
    }

    xhr.onerror = () => {
      done = true
      if (rejectNext) rejectNext(new Error("Network request failed"))
      else if (resolveNext) resolveNext()
    }

    xhr.send(body)

    while (true) {
      const newlineIdx = buffer.indexOf("\n")
      if (newlineIdx >= 0) {
        const line = buffer.slice(0, newlineIdx).trim()
        buffer = buffer.slice(newlineIdx + 1)
        if (line) {
          try {
            yield JSON.parse(line)
          } catch (e) {
            console.warn("Failed to parse ndjson line", line)
          }
        }
      } else {
        if (done) {
          if (buffer.trim()) {
            try {
              yield JSON.parse(buffer.trim())
            } catch (e) {}
          }
          break
        }
        await new Promise<void>((resolve, reject) => {
          resolveNext = resolve
          rejectNext = reject
        })
        resolveNext = null
        rejectNext = null
      }
    }
  }

  yield* streamEvents()
}
