import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    subject: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_subject", ["subject"]),
  connectionTokens: defineTable({
    userId: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  }).index("by_user_provider", ["userId", "provider"]),
})
