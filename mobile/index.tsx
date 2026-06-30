import { useQuery } from "@tanstack/react-query"
import { registerRootComponent } from "expo"
import { ActivityIndicator, View } from "react-native"
import { Uniwind, withUniwind } from "uniwind"
import { APIProvider } from "./api/provider"
import { AuthProvider, SignInScreen, useAuth } from "./auth"
import { AgenticDemo } from "./components/agentic/demo"

import "./theme.css"

Uniwind.setTheme("system")

const StyledView = withUniwind(View)

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <APIProvider>{children}</APIProvider>
    </AuthProvider>
  )
}

function Health() {
  useQuery({ queryKey: ["health"] })
  return <AgenticDemo />
}

function AuthGate() {
  const { isLoading, isSignedIn } = useAuth()

  if (isLoading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-white dark:bg-black">
        <ActivityIndicator />
      </StyledView>
    )
  }

  if (!isSignedIn) {
    return <SignInScreen />
  }

  return <Health />
}

function App() {
  return (
    <Providers>
      <AuthGate />
    </Providers>
  )
}

registerRootComponent(App)
