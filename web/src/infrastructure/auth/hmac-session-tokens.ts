import 'server-only'

import {createHmac, timingSafeEqual} from 'node:crypto'

import {SESSION_TTL_SECONDS, type Session} from '@/core/domain/account'
import {AuthUnavailableError} from '@/core/domain/errors'
import type {SessionTokens} from '@/core/ports/auth'

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

/**
 * Stateless session tokens: a base64url JSON payload and an HMAC-SHA256
 * signature over it. No session table, nothing to clean up, and revoking
 * everything is a secret rotation. Rotate `AUTH_SECRET` to sign everyone out.
 */
export function createHmacSessionTokens({secret}: {secret: string | null}): SessionTokens {
  function requireSecret(): string {
    if (!secret || secret.length < 32) throw new AuthUnavailableError()
    return secret
  }

  return {
    async issue(customerId) {
      const key = requireSecret()
      const issuedAt = Date.now()
      const session: Session = {customerId, issuedAt, expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000}
      const payload = base64url(JSON.stringify(session))
      return `${payload}.${sign(payload, key)}`
    },

    async verify(token) {
      const key = requireSecret()
      const [payload, signature, ...rest] = token.split('.')
      if (!payload || !signature || rest.length > 0) return null
      const expected = sign(payload, key)
      const a = Buffer.from(signature)
      const b = Buffer.from(expected)
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null
      try {
        const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<Session>
        if (
          typeof parsed.customerId !== 'string' ||
          typeof parsed.issuedAt !== 'number' ||
          typeof parsed.expiresAt !== 'number'
        ) {
          return null
        }
        return {customerId: parsed.customerId, issuedAt: parsed.issuedAt, expiresAt: parsed.expiresAt}
      } catch {
        return null
      }
    },
  }
}
