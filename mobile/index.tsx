import { registerRootComponent } from "expo"
import { Uniwind } from "uniwind"
import { APIProvider } from "./api/provider"
import { AgenticDemo } from "./components/agentic/demo"
import { initExecutorch } from "react-native-executorch"
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher"

import "./theme.css"

Uniwind.setTheme("system")
initExecutorch({ resourceFetcher: ExpoResourceFetcher })

function App() {
  return (
    <APIProvider>
      <AgenticDemo />
    </APIProvider>
  )
}

registerRootComponent(App)
