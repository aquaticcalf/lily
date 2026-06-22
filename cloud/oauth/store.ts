import { eq, and } from "drizzle-orm"
import { accounts } from "db"
import { db } from "./client"

export async function getConnectionToken(userId: string, connectionName: string) {
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, connectionName)))
    .limit(1)

  const account = result[0]
  if (!account) return null

  return {
    accessToken: account.access_token || "",
    refreshToken: account.refresh_token || "",
    expiresAt: account.expires_at ? account.expires_at * 1000 : null,
  }
}

export async function setConnectionToken(
  userId: string,
  connectionName: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
) {
  const existing = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, connectionName)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(accounts)
      .set({
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt ? Math.floor(expiresAt / 1000) : null,
      })
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, connectionName)))
  } else {
    await db.insert(accounts).values({
      userId,
      type: "oauth",
      provider: connectionName,
      providerAccountId: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt ? Math.floor(expiresAt / 1000) : null,
    })
  }
}
