import { v } from "convex/values"
import { internalMutation, internalQuery } from "./_generated/server"

export const getBySubject = internalQuery({
  args: { subject: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .unique()
  },
})

export const upsert = internalMutation({
  args: {
    subject: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        image: args.image,
      })
      return { _id: existing._id, isNew: false }
    }
    const _id = await ctx.db.insert("users", {
      subject: args.subject,
      email: args.email,
      name: args.name,
      image: args.image,
    })
    return { _id, isNew: true }
  },
})
