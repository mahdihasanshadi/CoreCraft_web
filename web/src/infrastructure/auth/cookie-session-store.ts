import 'server-only'

import {cookies} from 'next/headers'

import {SESSION_TTL_SECONDS} from '@/core/domain/account'
import type {SessionStore} from '@/core/ports/auth'

export const SESSION_COOKIE = 'cc_session'

/**
 * The session token travels in an httpOnly cookie, so page scripts cannot
 * read it. `set` and `clear` only work inside Server Actions and Route
 * Handlers, which is where sign-in and sign-out happen.
 */
export function createCookieSessionStore({secure}: {secure: boolean}): SessionStore {
  return {
    async current() {
      const jar = await cookies()
      return jar.get(SESSION_COOKIE)?.value ?? null
    },
    async set(token) {
      const jar = await cookies()
      jar.set({
        name: SESSION_COOKIE,
        value: token,
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
      })
    },
    async clear() {
      const jar = await cookies()
      jar.delete(SESSION_COOKIE)
    },
  }
}
