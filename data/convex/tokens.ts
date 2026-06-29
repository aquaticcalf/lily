import { v } from "convex/values"
import { internalMutation, internalQuery } from "./_generated/server"

export const get = internalQuery({
  args: { userId: v.string(), provider: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectionTokens")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique()
  },
})

export const set = internalMutation({
  args: {
    userId: v.string(),
    provider: v.string(),
    providerAccountId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connectionTokens")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider),
      )
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
      })
      return existing._id
    }
    return await ctx.db.insert("connectionTokens", {
      userId: args.userId,
      provider: args.provider,
      providerAccountId: args.providerAccountId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
    })
  },
})
