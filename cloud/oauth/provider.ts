import crypto from "node:crypto"
import {
  ConnectionAuthorizationRequiredError,
  defineInteractiveAuthorization,
} from "eve/connections"
import { getConnectionToken, setConnectionToken } from "./store.ts"
import type { OAuthConfig } from "./config.ts"

export function defineOAuth(opts: OAuthConfig) {
  return defineInteractiveAuthorization<{
    verifier?: string
    callbackUrl?: string
  }>({
    getToken: async ({ principal }) => {
      if (principal.type !== "user") throw new Error("Expected user principal for interactive auth")
      const userId = principal.id

      const data = await getConnectionToken(userId, opts.connectionName)
      if (!data) throw new ConnectionAuthorizationRequiredError(opts.connectionName)

      // auto-refresh token if within 5 minutes of expiry
      if (data.expiresAt && Date.now() > data.expiresAt - 5 * 60 * 1000) {
        if (!data.refreshToken) throw new ConnectionAuthorizationRequiredError(opts.connectionName)

        const params = new URLSearchParams()
        params.append("grant_type", "refresh_token")
        params.append("refresh_token", data.refreshToken)
        params.append("client_id", opts.clientId)
        if (opts.clientSecret) params.append("client_secret", opts.clientSecret)

        const res = await fetch(opts.tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        })

        if (!res.ok) throw new ConnectionAuthorizationRequiredError(opts.connectionName)

        const tokenRes = await res.json()
        const newExpiresAt = tokenRes.expires_in ? Date.now() + tokenRes.expires_in * 1000 : 0

        await setConnectionToken(
          userId,
          opts.connectionName,
          tokenRes.access_token,
          tokenRes.refresh_token || data.refreshToken,
          newExpiresAt,
        )
        return { token: tokenRes.access_token }
      }

      return { token: data.accessToken }
    },

    startAuthorization: async ({ callbackUrl }) => {
      const verifier = crypto.randomBytes(32).toString("base64url")
      const challenge = crypto.createHash("sha256").update(verifier).digest("base64url")

      const url = new URL(opts.authUrl)
      url.searchParams.set("response_type", "code")
      url.searchParams.set("client_id", opts.clientId)
      url.searchParams.set("redirect_uri", callbackUrl)
      url.searchParams.set("code_challenge", challenge)
      url.searchParams.set("code_challenge_method", "S256")
      if (opts.scopes) url.searchParams.set("scope", opts.scopes)

      return {
        challenge: { url: url.toString() },
        resume: { verifier, callbackUrl },
      }
    },

    completeAuthorization: async ({ resume, callback, principal }) => {
      if (principal.type !== "user") throw new Error("Expected user principal for interactive auth")
      const userId = principal.id

      const params = new URLSearchParams()
      params.append("grant_type", "authorization_code")
      params.append("code", callback.params.code as string)
      if (resume?.callbackUrl) {
        params.append("redirect_uri", resume.callbackUrl)
      }
      params.append("client_id", opts.clientId)
      if (opts.clientSecret) params.append("client_secret", opts.clientSecret)
      if (resume?.verifier) params.append("code_verifier", resume.verifier)

      const res = await fetch(opts.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Failed to exchange code: ${text}`)
      }

      const tokenRes = await res.json()
      const newExpiresAt = tokenRes.expires_in ? Date.now() + tokenRes.expires_in * 1000 : 0

      await setConnectionToken(
        userId,
        opts.connectionName,
        tokenRes.access_token,
        tokenRes.refresh_token || "",
        newExpiresAt,
      )
      return { token: tokenRes.access_token }
    },
  })
}
