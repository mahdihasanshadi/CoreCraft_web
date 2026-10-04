import {describe, expect, it} from 'vitest'

import {InvalidCredentialsError, PhoneAlreadyRegisteredError} from '@/core/domain/errors'
import type {PasswordHasher, SessionStore, SessionTokens} from '@/core/ports/auth'
import type {CustomerRecord, CustomerRepository, OrderRepository} from '@/core/ports/commerce-repositories'

import {makeAccountUseCases} from './accounts'

function harness(seed: {record: CustomerRecord; passwordHash: string | null}[] = []) {
  const store = new Map(seed.map((entry) => [entry.record.phone, {...entry}]))
  let cookie: string | null = null
  const logins: string[] = []

  const customers: CustomerRepository = {
    findById: async (id) => [...store.values()].find((entry) => entry.record.id === id)?.record ?? null,
    findByPhone: async (phone) => store.get(phone)?.record ?? null,
    findCredentialsByPhone: async (phone) => {
      const entry = store.get(phone)
      return entry ? {account: entry.record, passwordHash: entry.passwordHash} : null
    },
    create: async () => {
      throw new Error('not used')
    },
    register: async (account) => {
      const existing = store.get(account.phone)
      const record = existing?.record ?? {id: `cust-${store.size + 1}`, name: account.name, phone: account.phone, email: account.email}
      store.set(account.phone, {record: {...record, name: account.name}, passwordHash: account.passwordHash})
      return store.get(account.phone)!.record
    },
    recordLogin: async (id) => {
      logins.push(id)
    },
    updateProfile: async () => {
      throw new Error('not used')
    },
  }
  const orders: OrderRepository = {
    create: async () => ({id: 'o'}),
    findByNumber: async () => null,
    listByCustomer: async () => [],
  }
  const hasher: PasswordHasher = {
    hash: async (password) => `hashed:${password}`,
    verify: async (password, hash) => hash === `hashed:${password}`,
  }
  const tokens: SessionTokens = {
    issue: async (customerId) => `token:${customerId}`,
    verify: async (token) =>
      token.startsWith('token:')
        ? {customerId: token.slice(6), issuedAt: Date.now() - 1000, expiresAt: Date.now() + 100000}
        : null,
  }
  const session: SessionStore = {
    current: async () => cookie,
    set: async (token) => {
      cookie = token
    },
    clear: async () => {
      cookie = null
    },
  }

  const useCases = makeAccountUseCases({customers, orders, hasher, tokens, session})
  return {useCases, logins, cookie: () => cookie}
}

const guest = {record: {id: 'cust-guest', name: 'Guest', phone: '01700000000', email: null}, passwordHash: null}
const member = {record: {id: 'cust-member', name: 'Member', phone: '01800000000', email: null}, passwordHash: 'hashed:secret123'}

describe('registerCustomer', () => {
  it('creates an account, signs in, and records the login', async () => {
    const {useCases, logins, cookie} = harness()
    const account = await useCases.registerCustomer({name: 'New', phone: '01911111111', email: null, password: 'longenough'})
    expect(account.phone).toBe('01911111111')
    expect(cookie()).toBe(`token:${account.id}`)
    expect(logins).toEqual([account.id])
    expect(await useCases.getCurrentCustomer()).toMatchObject({id: account.id})
  })

  it('lets a guest claim their record, keeping its id', async () => {
    const {useCases} = harness([guest])
    const account = await useCases.registerCustomer({name: 'Guest Now', phone: guest.record.phone, email: null, password: 'longenough'})
    expect(account.id).toBe('cust-guest')
  })

  it('refuses a phone that already has a password', async () => {
    const {useCases} = harness([member])
    await expect(
      useCases.registerCustomer({name: 'X', phone: member.record.phone, email: null, password: 'longenough'}),
    ).rejects.toBeInstanceOf(PhoneAlreadyRegisteredError)
  })

  it('enforces the minimum password length', async () => {
    const {useCases} = harness()
    await expect(
      useCases.registerCustomer({name: 'X', phone: '01911111111', email: null, password: 'short'}),
    ).rejects.toThrow(/at least 8/)
  })
})

describe('loginCustomer', () => {
  it('signs in with the right password', async () => {
    const {useCases, cookie} = harness([member])
    const account = await useCases.loginCustomer({phone: member.record.phone, password: 'secret123'})
    expect(account.id).toBe('cust-member')
    expect(cookie()).toBe('token:cust-member')
  })

  it('gives the same error for a wrong password, an unknown phone, and a guest without a password', async () => {
    const {useCases} = harness([member, guest])
    for (const attempt of [
      {phone: member.record.phone, password: 'wrong'},
      {phone: '01999999999', password: 'secret123'},
      {phone: guest.record.phone, password: 'anything'},
    ]) {
      await expect(useCases.loginCustomer(attempt)).rejects.toBeInstanceOf(InvalidCredentialsError)
    }
  })

  it('signs out by clearing the session', async () => {
    const {useCases, cookie} = harness([member])
    await useCases.loginCustomer({phone: member.record.phone, password: 'secret123'})
    await useCases.logoutCustomer()
    expect(cookie()).toBeNull()
    expect(await useCases.getCurrentCustomer()).toBeNull()
  })
})
