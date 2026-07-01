import { Linking } from "react-native"
import { base64URLEncode } from "./transport"
import type { SecureStoreOAuthClientProvider } from "./provider"
import type { OAuthClientInformation } from "./types"
import type { StreamableHTTPTransport } from "./transport"

function sha256(data: Uint8Array): Uint8Array {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]

  let H0 = 0x6a09e667,
    H1 = 0xbb67ae85,
    H2 = 0x3c6ef372,
    H3 = 0xa54ff53a
  let H4 = 0x510e527f,
    H5 = 0x9b05688c,
    H6 = 0x1f83d9ab,
    H7 = 0x5be0cd19

  const bitLen = data.length * 8
  const padLen = (data.length + 9 + 63) & ~63
  const padded = new Uint8Array(padLen)
  padded.set(data)
  padded[data.length] = 0x80

  const dv = new DataView(padded.buffer)
  dv.setUint32(padLen - 4, bitLen >>> 0, false)
  dv.setUint32(padLen - 8, 0, false)

  const W = new Uint32Array(64)

  for (let block = 0; block < padLen; block += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = dv.getUint32(block + t * 4, false)
    }
    for (let t = 16; t < 64; t++) {
      const s0 =
        ((W[t - 15] >>> 7) | (W[t - 15] << 25)) ^
        ((W[t - 15] >>> 18) | (W[t - 15] << 14)) ^
        (W[t - 15] >>> 3)
      const s1 =
        ((W[t - 2] >>> 17) | (W[t - 2] << 15)) ^
        ((W[t - 2] >>> 19) | (W[t - 2] << 13)) ^
        (W[t - 2] >>> 10)
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0
    }

    let a = H0,
      b = H1,
      c = H2,
      d = H3
    let e = H4,
      f = H5,
      g = H6,
      h = H7

    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    H0 = (H0 + a) >>> 0
    H1 = (H1 + b) >>> 0
    H2 = (H2 + c) >>> 0
    H3 = (H3 + d) >>> 0
    H4 = (H4 + e) >>> 0
    H5 = (H5 + f) >>> 0
    H6 = (H6 + g) >>> 0
    H7 = (H7 + h) >>> 0
  }

  const result = new Uint8Array(32)
  const rdv = new DataView(result.buffer)
  rdv.setUint32(0, H0, false)
  rdv.setUint32(4, H1, false)
  rdv.setUint32(8, H2, false)
  rdv.setUint32(12, H3, false)
  rdv.setUint32(16, H4, false)
  rdv.setUint32(20, H5, false)
  rdv.setUint32(24, H6, false)
  rdv.setUint32(28, H7, false)
  return result
}

function generateCodeVerifier(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let result = ""
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result.substring(0, 43)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const hash = sha256(encoder.encode(verifier))
  return base64URLEncode(hash)
}

function waitForCodeFromDeepLink(redirectUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const subscription = Linking.addEventListener("url", (event) => {
      if (event.url.startsWith(redirectUrl)) {
        const url = new URL(event.url)
        const code = url.searchParams.get("code")
        if (code) {
          subscription.remove()
          resolve(code)
        }
      }
    })
    setTimeout(() => {
      subscription.remove()
      reject(new Error("Authorization timed out"))
    }, 120_000)
  })
}

interface OAuthServerInfo {
  authorizationServerUrl: string
  authorizationServerMetadata?: Record<string, unknown>
  resourceMetadata?: Record<string, unknown>
}

export async function discoverOAuthServerInfo(serverUrl: string): Promise<OAuthServerInfo> {
  const { LATEST_PROTOCOL_VERSION } = await import("./types")

  async function discoverProtectedResource(
    url: string,
  ): Promise<{ metadata?: Record<string, unknown>; authServers?: string[] } | null> {
    try {
      const paths = ["/.well-known/oauth-protected-resource"]
      const serverURL = new URL(url)
      if (serverURL.pathname !== "/") {
        const path = serverURL.pathname.endsWith("/")
          ? serverURL.pathname.slice(0, -1)
          : serverURL.pathname
        paths.unshift(`/.well-known/oauth-protected-resource${path}`)
      }

      for (const p of paths) {
        const wellKnownUrl = new URL(p, serverURL.origin)
        const response = await fetch(wellKnownUrl.toString(), {
          headers: { "MCP-Protocol-Version": LATEST_PROTOCOL_VERSION },
        })
        if (response.ok) {
          const data = await response.json()
          return {
            metadata: data,
            authServers: data.authorization_servers,
          }
        }
        if (response.status !== 404) {
          await response.body?.cancel()
        }
      }
      return null
    } catch {
      return null
    }
  }

  async function discoverAuthServerMetadata(
    asUrl: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const urls = [
        `${asUrl}.well-known/oauth-authorization-server`,
        `${asUrl}.well-known/openid-configuration`,
      ]
      for (const url of urls) {
        const response = await fetch(url, {
          headers: { "MCP-Protocol-Version": LATEST_PROTOCOL_VERSION },
        })
        if (response.ok) {
          return await response.json()
        }
      }
      return undefined
    } catch {
      return undefined
    }
  }

  const resourceInfo = await discoverProtectedResource(serverUrl)
  let authorizationServerUrl: string
  if (resourceInfo?.authServers?.length) {
    authorizationServerUrl = resourceInfo.authServers[0]
  } else {
    authorizationServerUrl = new URL("/", serverUrl).toString()
  }

  const authServerMetadata = await discoverAuthServerMetadata(authorizationServerUrl)

  return {
    authorizationServerUrl,
    authorizationServerMetadata: authServerMetadata,
    resourceMetadata: resourceInfo?.metadata,
  }
}

export async function auth(
  provider: SecureStoreOAuthClientProvider,
  options: {
    serverUrl: string
    authorizationCode?: string
    resourceMetadataUrl?: string
    scope?: string
  },
): Promise<"AUTHORIZED" | "REDIRECT"> {
  const { serverUrl, authorizationCode, scope } = options

  let discovery = await provider.discoveryState()

  if (!discovery) {
    const serverInfo = await discoverOAuthServerInfo(serverUrl)
    discovery = {
      authorizationServerUrl: serverInfo.authorizationServerUrl,
      authorizationServerMetadata: serverInfo.authorizationServerMetadata,
      resourceMetadata: serverInfo.resourceMetadata,
    }
    await provider.saveDiscoveryState(discovery)
  }

  const asUrl = discovery.authorizationServerUrl
  const metadata = discovery.authorizationServerMetadata as Record<string, string> | undefined

  let clientInfo = await provider.clientInformation()
  if (!clientInfo && authorizationCode) {
    throw new Error(
      "Existing OAuth client information is required when exchanging an authorization code",
    )
  }

  if (!clientInfo) {
    const regEndpoint = metadata?.registration_endpoint
    if (regEndpoint) {
      const response = await fetch(regEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provider.clientMetadata),
      })
      if (!response.ok) {
        throw new Error(`Failed to register client: ${response.status}`)
      }
      clientInfo = (await response.json()) as OAuthClientInformation
      await provider.saveClientInformation(clientInfo)
    } else {
      clientInfo = { client_id: provider.serviceId }
      await provider.saveClientInformation(clientInfo)
    }
  }
  clientInfo = clientInfo!

  if (authorizationCode) {
    const codeVerifier = await provider.codeVerifier()
    const redirectUrl = provider.redirectUrl
    const tokenUrl = metadata?.token_endpoint || `${asUrl}token`
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      code_verifier: codeVerifier,
      redirect_uri: redirectUrl,
    })
    if (clientInfo.client_id) {
      params.set("client_id", clientInfo.client_id)
    }
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`)
    }
    const tokens = await tokenResponse.json()
    await provider.saveTokens(tokens)
    return "AUTHORIZED"
  }

  const existingTokens = await provider.tokens()
  if (existingTokens?.refresh_token) {
    const tokenUrl = metadata?.token_endpoint || `${asUrl}token`
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: existingTokens.refresh_token,
    })
    if (clientInfo.client_id) {
      params.set("client_id", clientInfo.client_id)
    }
    if (scope) {
      params.set("scope", scope)
    }
    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      })
      if (tokenResponse.ok) {
        const tokens = await tokenResponse.json()
        await provider.saveTokens({
          ...existingTokens,
          ...tokens,
          refresh_token: tokens.refresh_token || existingTokens.refresh_token,
        })
        return "AUTHORIZED"
      }
    } catch {}
  } else if (existingTokens?.access_token) {
    return "AUTHORIZED"
  }

  const authEndpoint = metadata?.authorization_endpoint || `${asUrl}authorize`
  const codeVerifier = generateCodeVerifier()
  await provider.saveCodeVerifier(codeVerifier)
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const redirectUrl = provider.redirectUrl

  const authUrl = new URL(authEndpoint)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("client_id", clientInfo.client_id)
  authUrl.searchParams.set("redirect_uri", redirectUrl)
  authUrl.searchParams.set("code_challenge", codeChallenge)
  authUrl.searchParams.set("code_challenge_method", "S256")
  if (scope) {
    authUrl.searchParams.set("scope", scope)
  }

  await provider.redirectToAuthorization(authUrl)

  return "REDIRECT"
}

export async function authorizeService(
  provider: SecureStoreOAuthClientProvider,
  serverUrl: string,
): Promise<void> {
  const tokens = await provider.tokens()
  if (tokens) return

  const codePromise = waitForCodeFromDeepLink(provider.redirectUrl)

  const result = await auth(provider, { serverUrl })
  if (result !== "REDIRECT") return

  const authUrl = provider.getAuthorizationUrl()
  if (!authUrl) throw new Error("No authorization URL available")

  await Linking.openURL(authUrl)
  const code = await codePromise

  await auth(provider, { serverUrl, authorizationCode: code })
}

export async function reconnectService(
  transport: StreamableHTTPTransport,
  provider: SecureStoreOAuthClientProvider,
  serverUrl: string,
): Promise<void> {
  const codePromise = waitForCodeFromDeepLink(provider.redirectUrl)

  const result = await auth(provider, { serverUrl })
  if (result !== "REDIRECT") return

  const authUrl = provider.getAuthorizationUrl()
  if (!authUrl) throw new Error("No authorization URL available")

  await Linking.openURL(authUrl)
  const code = await codePromise

  await transport.finishAuth(code)
}
