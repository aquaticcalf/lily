import { useQuery } from "@tanstack/react-query"
import { registerRootComponent } from "expo"
import { Text, View } from "react-native"
import { Uniwind, withUniwind } from "uniwind"
import { APIProvider } from "./api/provider"

import "./theme.css"

Uniwind.setTheme("system")

const StyledView = withUniwind(View)
const StyledText = withUniwind(Text)

function Providers({ children }: { children: React.ReactNode }) {
  return <APIProvider>{children}</APIProvider>
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

function App() {
  return (
    <Providers>
      <Health />
    </Providers>
  )
}

registerRootComponent(App)
