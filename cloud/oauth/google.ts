import {
  type AuthFn,
  extractBearerToken,
  ForbiddenError,
  UnauthenticatedError,
} from "eve/channels/auth"
import { internal } from "data/convex/_generated/api"
import { OAuth2Client } from "google-auth-library"
import { convexInternalMutation } from "../convex"
import { env } from "../env"

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

export function nativeGoogleAuth(): AuthFn<Request> {
  return async (request) => {
    const token = extractBearerToken(request.headers.get("authorization"))
    if (!token) return null

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      if (!payload || !payload.sub) throw new Error("No payload")

      const userId = payload.sub

      if (!payload.email) {
        throw new ForbiddenError({ message: "google account has no email." })
      }

      await convexInternalMutation(internal.users.upsert, {
        subject: userId,
        email: payload.email,
        name: payload.name ?? "",
        image: payload.picture ?? "",
      })

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
