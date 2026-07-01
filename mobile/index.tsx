import { registerRootComponent } from "expo"
import { Uniwind } from "uniwind"
import { APIProvider } from "./api/provider"
import McpTest from "./components/mcp"

import "./theme.css"

Uniwind.setTheme("system")

function App() {
  return (
    <APIProvider>
      <McpTest />
    </APIProvider>
  )
}

registerRootComponent(App)
