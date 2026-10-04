/** A signed-in shopper, as the rest of the app sees them. */
export interface CustomerAccount {
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly email: string | null
}

/** What a session token carries. Nothing secret, and nothing the server trusts without verifying. */
export interface Session {
  readonly customerId: string
  readonly issuedAt: number
  readonly expiresAt: number
}

export const MIN_PASSWORD_LENGTH = 8
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export function isSessionLive(session: Session, now: number = Date.now()): boolean {
  return session.expiresAt > now && session.issuedAt <= now
}
