import { AuthProvider as OidcAuthProvider } from 'react-oidc-context'
import { OIDC_CONFIG } from '../config/auth'
import type { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  return <OidcAuthProvider {...OIDC_CONFIG}>{children}</OidcAuthProvider>
}
