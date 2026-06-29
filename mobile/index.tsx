import { useQuery } from "@tanstack/react-query"
import { registerRootComponent } from "expo"
import { ActivityIndicator, Text, View } from "react-native"
import { Uniwind, withUniwind } from "uniwind"
import { APIProvider } from "./api/provider"
import { AuthProvider, SignInScreen, useAuth } from "./auth"

import "./theme.css"

Uniwind.setTheme("system")

const StyledView = withUniwind(View)
const StyledText = withUniwind(Text)

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <APIProvider>{children}</APIProvider>
    </AuthProvider>
  )
}

function Health() {
  const { data, isSuccess, isError } = useQuery({ queryKey: ["health"] })
  return (
    <StyledView className="flex-1 justify-center items-center bg-white dark:bg-black">
      <StyledText className="text-lg text-black dark:text-white">
        {isSuccess ? "ok" : isError ? "not ok" : "loading..."}
      </StyledText>
      <StyledText>{JSON.stringify(data)}</StyledText>
    </StyledView>
  )
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
