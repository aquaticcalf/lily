import { ConvexHttpClient } from "convex/browser"
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server"
import { env } from "./env"

type AdminConvexHttpClient = ConvexHttpClient & {
  setAdminAuth(token: string): void
}

type InternalQuery = FunctionReference<"query", "internal">
type InternalMutation = FunctionReference<"mutation", "internal">

export const convex = new ConvexHttpClient(env.CONVEX_URL)
;(convex as AdminConvexHttpClient).setAdminAuth(env.CONVEX_ADMIN_KEY)

export function convexInternalQuery<Query extends InternalQuery>(
  query: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
  return convex.query(query as unknown as FunctionReference<"query">, args) as Promise<
    FunctionReturnType<Query>
  >
}

export function convexInternalMutation<Mutation extends InternalMutation>(
  mutation: Mutation,
  args: FunctionArgs<Mutation>,
): Promise<FunctionReturnType<Mutation>> {
  return convex.mutation(mutation as unknown as FunctionReference<"mutation">, args) as Promise<
    FunctionReturnType<Mutation>
  >
}
