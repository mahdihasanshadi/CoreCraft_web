import type {Session} from '../domain/account'

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, storedHash: string): Promise<boolean>
}

/** Mints and checks the opaque token that identifies a session. */
export interface SessionTokens {
  issue(customerId: string): Promise<string>
  /** Null for anything tampered with, expired, or signed with another secret. */
  verify(token: string): Promise<Session | null>
}

/** Where the current request keeps its session token. */
export interface SessionStore {
  current(): Promise<string | null>
  /** Only callable where the platform allows setting cookies: actions and route handlers. */
  set(token: string): Promise<void>
  clear(): Promise<void>
}
