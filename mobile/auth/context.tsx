import {
  GoogleOneTapSignIn,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
} from "react-native-nitro-google-signin"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { setAuthToken } from "../api/client"
import { env } from "../env"

GoogleOneTapSignIn.configure({
  webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

interface AuthState {
  idToken: string | null
  user: { name: string; email: string; photo: string | null } | null
  isLoading: boolean
  isSignedIn: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthState["user"]>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applySession = useCallback((token: string | null, nextUser: AuthState["user"]) => {
    setAuthToken(token)
    setIdToken(token)
    setUser(nextUser)
  }, [])

  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await GoogleOneTapSignIn.signIn()
        if (isSuccessResponse(response)) {
          applySession(response.data.idToken, {
            name: response.data.user.name ?? "",
            email: response.data.user.email ?? "",
            photo: response.data.user.photo,
          })
        }
      } catch {
        applySession(null, null)
      } finally {
        setIsLoading(false)
      }
    }
    void restoreSession()
  }, [applySession])

  const signIn = useCallback(async () => {
    let response = await GoogleOneTapSignIn.createAccount()
    if (isNoSavedCredentialFoundResponse(response)) {
      response = await GoogleOneTapSignIn.presentExplicitSignIn()
    }
    if (isSuccessResponse(response)) {
      applySession(response.data.idToken, {
        name: response.data.user.name ?? "",
        email: response.data.user.email ?? "",
        photo: response.data.user.photo,
      })
    }
  }, [applySession])

  const signOut = useCallback(async () => {
    await GoogleOneTapSignIn.signOut()
    applySession(null, null)
  }, [applySession])

  const value = useMemo<AuthState>(
    () => ({
      idToken,
      user,
      isLoading,
      isSignedIn: !!idToken,
      signIn,
      signOut,
    }),
    [idToken, user, isLoading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
