import * as WebBrowser from "expo-web-browser"
import * as HttpServer from "expo-http-server"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import {
  auth,
  discoverOAuthServerInfo,
  type AuthResult,
} from "@modelcontextprotocol/sdk/client/auth.js"
import { SecureStoreOAuthClientProvider } from "./provider"
import type { MCPServiceConfig, ConnectedMCPService } from "./types"

const LOCALHOST_PORT = 9876

async function waitForCodeAndRedirect(serviceId: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    HttpServer.setup(LOCALHOST_PORT)
    HttpServer.route(`/callback/${serviceId}`, "GET", async (request) => {
      const params = JSON.parse(request.paramsJson)
      const code = params.code ?? null
      if (code) {
        resolve(code)
        return {
          statusCode: 302,
          headers: { Location: `lily://auth/mcp/${serviceId}` },
        }
      }
      return { statusCode: 400, body: "Missing code" }
    })
    HttpServer.start()
    setTimeout(() => reject(new Error("Authorization timed out")), 120_000)
  })
}

export async function authorizeService(
  provider: SecureStoreOAuthClientProvider,
  serverUrl: string,
): Promise<void> {
  const tokens = await provider.tokens()
  if (tokens) return

  provider.setRedirectPort(LOCALHOST_PORT)

  const codePromise = waitForCodeAndRedirect(provider["serviceId"] as string)

  const result: AuthResult = await auth(provider, { serverUrl })
  if (result !== "REDIRECT") return

  const authUrl = provider.getAuthorizationUrl()
  if (!authUrl) throw new Error("No authorization URL available")

  await WebBrowser.openBrowserAsync(authUrl)
  HttpServer.stop()
  const code = await codePromise

  await auth(provider, { serverUrl, authorizationCode: code })
}

export async function reconnectService(
  transport: StreamableHTTPClientTransport,
  provider: SecureStoreOAuthClientProvider,
  serverUrl: string,
): Promise<void> {
  provider.setRedirectPort(LOCALHOST_PORT)

  const codePromise = waitForCodeAndRedirect(provider["serviceId"] as string)

  const result: AuthResult = await auth(provider, { serverUrl })
  if (result !== "REDIRECT") return

  const authUrl = provider.getAuthorizationUrl()
  if (!authUrl) throw new Error("No authorization URL available")

  await WebBrowser.openBrowserAsync(authUrl)
  HttpServer.stop()
  const code = await codePromise

  await transport.finishAuth(code)
}

export async function connectService(config: MCPServiceConfig): Promise<ConnectedMCPService> {
  const provider = new SecureStoreOAuthClientProvider(config.id)

  const serverInfo = await discoverOAuthServerInfo(config.serverUrl)
  await provider.saveDiscoveryState({
    authorizationServerUrl: serverInfo.authorizationServerUrl,
    authorizationServerMetadata: serverInfo.authorizationServerMetadata,
    resourceMetadata: serverInfo.resourceMetadata,
  })

  await authorizeService(provider, config.serverUrl)

  const transport = new StreamableHTTPClientTransport(new URL(config.serverUrl), {
    authProvider: provider,
  })

  const client = new Client({ name: "lily", version: "1.0.0" }, { capabilities: {} })

  await client.connect(transport)

  return { config, client, transport, provider }
}

export async function disconnectService(connected: ConnectedMCPService): Promise<void> {
  try {
    await connected.transport.close()
  } catch {
    /* ignore */
  }
  try {
    await connected.client.close()
  } catch {
    /* ignore */
  }
  await connected.provider.invalidateCredentials("all")
}
