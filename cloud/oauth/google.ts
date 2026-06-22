import {
  type AuthFn,
  extractBearerToken,
  ForbiddenError,
  UnauthenticatedError,
} from "eve/channels/auth"
import { db } from "./client"
import { users } from "db"
import { eq } from "drizzle-orm"
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export function nativeGoogleAuth(): AuthFn<Request> {
  return async (request) => {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) return null

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      if (!payload || !payload.sub) throw new Error("No payload")

      const userId = payload.sub

      let user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

      if (user.length === 0) {
        if (!payload.email) {
          throw new ForbiddenError({ message: "google account has no email." })
        }

        const newUser = await db
          .insert(users)
          .values({
            id: userId,
            email: payload.email,
            name: payload.name ?? "",
            image: payload.picture ?? "",
          })
          .returning()

        user = newUser
      }

      return {
        principalId: userId,
        principalType: "user",
        authenticator: "google",
        attributes: {
          email: payload.email ?? "",
          name: payload.name ?? "",
        },
      }
    } catch (err) {
      if (err instanceof ForbiddenError) throw err
      throw new UnauthenticatedError({
        message: "invalid or expired google session.",
      })
    }
  }
}
