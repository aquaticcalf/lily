export interface OAuthConfig {
  connectionName: string
  clientId: string
  clientSecret?: string
  authUrl: string
  tokenUrl: string
  scopes?: string
}
