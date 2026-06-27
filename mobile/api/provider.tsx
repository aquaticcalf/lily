import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode } from "react"
import { client } from "./client"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const { data } = await client.get(queryKey.join("/"))
        return data
      },
    },
  },
})

export function APIProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
