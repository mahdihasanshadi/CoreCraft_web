import 'server-only'

import {randomBytes, scrypt, timingSafeEqual, type ScryptOptions} from 'node:crypto'

import type {PasswordHasher} from '@/core/ports/auth'

const KEY_LENGTH = 64
const PARAMS = {N: 16384, r: 8, p: 1}

function derive(password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, length, options, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

/**
 * Password hashing with Node's built-in scrypt. No native dependency, memory
 * hard, and the parameters are stored with each hash so they can be raised
 * later without invalidating existing accounts.
 *
 * Format: scrypt$N$r$p$saltHex$hashHex
 */
export function createScryptPasswordHasher(): PasswordHasher {
  return {
    async hash(password) {
      const salt = randomBytes(16)
      const derived = await derive(password, salt, KEY_LENGTH, PARAMS)
      return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('hex'), derived.toString('hex')].join('$')
    },

    async verify(password, storedHash) {
      const parts = storedHash.split('$')
      if (parts.length !== 6 || parts[0] !== 'scrypt') return false
      const [, N, r, p, saltHex, hashHex] = parts
      const expected = Buffer.from(hashHex, 'hex')
      try {
        const derived = await derive(password, Buffer.from(saltHex, 'hex'), expected.length, {
          N: Number(N),
          r: Number(r),
          p: Number(p),
        })
        return derived.length === expected.length && timingSafeEqual(derived, expected)
      } catch {
        return false
      }
    },
  }
}
