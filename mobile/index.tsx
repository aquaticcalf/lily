import { useQuery } from "@tanstack/react-query"
import { registerRootComponent } from "expo"
import { Text, View } from "react-native"
import { APIProvider } from "./api/provider"

function Providers({ children }: { children: React.ReactNode }) {
  return <APIProvider>{children}</APIProvider>
}

function App() {
  const { data, isSuccess, isError } = useQuery({ queryKey: ["health"] })
  return (
    <Providers>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{isSuccess ? "ok" : isError ? "not ok" : "loading..."}</Text>
        <Text>{JSON.stringify(data)}</Text>
      </View>
    </Providers>
  )
}

registerRootComponent(App)
