import type { User } from 'oidc-client-ts'

// ─── Roles ────────────────────────────────────────────────────────────────────
export type AppRole = 'public_user' | 'caas_io' | 'adp_ao'

export const ROLE_LABELS: Record<AppRole, string> = {
  public_user: 'Public User',
  caas_io: 'CAAS Inspection Officer',
  adp_ao: 'ADP Approving Officer',
}

const ALL_ROLES: AppRole[] = ['public_user', 'caas_io', 'adp_ao']

// ─── OIDC config ──────────────────────────────────────────────────────────────
// ASSUMPTION(US-21): Keycloak is the identity provider for the demo.
// In production: public users → Singpass/Corppass; CAAS officers → AD/OIDC.
export const OIDC_CONFIG = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY as string,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID as string,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  scope: 'openid profile email',
}

// ─── Role helpers ─────────────────────────────────────────────────────────────
// Keycloak includes realm_access in the ID token when the
// "realm roles" protocol mapper is enabled in the client scope.
export function getRoles(user: User | null | undefined): AppRole[] {
  const profile = user?.profile as Record<string, unknown> | undefined
  const realmAccess = profile?.realm_access as { roles?: string[] } | undefined
  return (realmAccess?.roles ?? []).filter((r): r is AppRole => ALL_ROLES.includes(r as AppRole))
}

export function hasAnyRole(user: User | null | undefined, roles: AppRole[]): boolean {
  return getRoles(user).some((r) => roles.includes(r))
}

// Returns the highest-privilege role the user holds.
export function getPrimaryRole(user: User | null | undefined): AppRole | null {
  const roles = getRoles(user)
  if (roles.includes('adp_ao')) return 'adp_ao'
  if (roles.includes('caas_io')) return 'caas_io'
  if (roles.includes('public_user')) return 'public_user'
  return null
}
