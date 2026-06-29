import { internal } from "data/convex/_generated/api"
import { convexInternalMutation, convexInternalQuery } from "../convex"

export async function getConnectionToken(userId: string, connectionName: string) {
  const token = await convexInternalQuery(internal.tokens.get, { userId, provider: connectionName })
  if (!token) return null

  return {
    accessToken: token.accessToken || "",
    refreshToken: token.refreshToken || "",
    expiresAt: token.expiresAt ?? null,
  }
}

export async function setConnectionToken(
  userId: string,
  connectionName: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
) {
  await convexInternalMutation(internal.tokens.set, {
    userId,
    provider: connectionName,
    providerAccountId: userId,
    accessToken,
    refreshToken,
    expiresAt: expiresAt || undefined,
  })
}
