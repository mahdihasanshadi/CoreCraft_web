import {describe, expect, it} from 'vitest'

import {AuthUnavailableError} from '@/core/domain/errors'

import {createHmacSessionTokens} from './hmac-session-tokens'
import {createScryptPasswordHasher} from './scrypt-password-hasher'

const secret = 'a-test-secret-that-is-at-least-32-characters-long'

describe('scrypt password hasher', () => {
  const hasher = createScryptPasswordHasher()

  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hasher.hash('correct horse battery')
    expect(hash.startsWith('scrypt$16384$8$1$')).toBe(true)
    expect(await hasher.verify('correct horse battery', hash)).toBe(true)
    expect(await hasher.verify('correct horse batterx', hash)).toBe(false)
  })

  it('salts, so the same password hashes differently each time', async () => {
    expect(await hasher.hash('same')).not.toBe(await hasher.hash('same'))
  })

  it('rejects malformed stored hashes instead of throwing', async () => {
    expect(await hasher.verify('x', 'not-a-hash')).toBe(false)
    expect(await hasher.verify('x', 'scrypt$a$b$c$zz$zz')).toBe(false)
  })
})

describe('HMAC session tokens', () => {
  it('round-trips a customer id', async () => {
    const tokens = createHmacSessionTokens({secret})
    const token = await tokens.issue('cust-1')
    const session = await tokens.verify(token)
    expect(session?.customerId).toBe('cust-1')
    expect(session!.expiresAt).toBeGreaterThan(session!.issuedAt)
  })

  it('rejects tampering and tokens from another secret', async () => {
    const tokens = createHmacSessionTokens({secret})
    const token = await tokens.issue('cust-1')
    const [payload, signature] = token.split('.')
    const forgedPayload = Buffer.from(JSON.stringify({customerId: 'cust-2', issuedAt: 1, expiresAt: 9e15})).toString('base64url')
    expect(await tokens.verify(`${forgedPayload}.${signature}`)).toBeNull()
    expect(await tokens.verify(`${payload}.${signature.slice(0, -2)}xx`)).toBeNull()
    expect(await tokens.verify('garbage')).toBeNull()

    const other = createHmacSessionTokens({secret: secret + '-rotated'})
    expect(await other.verify(token)).toBeNull()
  })

  it('refuses to work without a strong secret', async () => {
    const tokens = createHmacSessionTokens({secret: null})
    await expect(tokens.issue('x')).rejects.toBeInstanceOf(AuthUnavailableError)
    const weak = createHmacSessionTokens({secret: 'short'})
    await expect(weak.verify('a.b')).rejects.toBeInstanceOf(AuthUnavailableError)
  })
})
