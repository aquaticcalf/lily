import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const localConvexConfigPath = resolve(root, "data/.convex/local/default/config.json")

if (!process.env.CONVEX_ADMIN_KEY && existsSync(localConvexConfigPath)) {
  const config = JSON.parse(readFileSync(localConvexConfigPath, "utf8"))
  process.env.CONVEX_ADMIN_KEY = config.adminKey
}

if (!process.env.CONVEX_URL && existsSync(localConvexConfigPath)) {
  const config = JSON.parse(readFileSync(localConvexConfigPath, "utf8"))
  process.env.CONVEX_URL = `http://127.0.0.1:${config.ports.cloud}`
}

if (!process.env.CONVEX_ADMIN_KEY) {
  console.error(
    "Missing CONVEX_ADMIN_KEY. Start Convex once from the data package or set CONVEX_ADMIN_KEY in cloud/.env.",
  )
  process.exit(1)
}

const child = spawn("eve", ["dev", "--host", "0.0.0.0"], {
  cwd: resolve(root, "cloud"),
  env: process.env,
  shell: true,
  stdio: "inherit",
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
