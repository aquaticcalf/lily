import { eveChannel } from "eve/channels/eve"
import { localDev, vercelOidc } from "eve/channels/auth"
import { nativeGoogleAuth } from "../../oauth/google.ts"

export default eveChannel({
  auth: [localDev(), vercelOidc(), nativeGoogleAuth()],
})
