import {isSessionLive, MIN_PASSWORD_LENGTH, type CustomerAccount} from '@/core/domain/account'
import {
  AuthUnavailableError,
  InvalidCredentialsError,
  NotAuthenticatedError,
  OrderValidationError,
  PhoneAlreadyRegisteredError,
} from '@/core/domain/errors'
import type {PlacedOrder} from '@/core/domain/order'
import type {PasswordHasher, SessionStore, SessionTokens} from '@/core/ports/auth'
import type {CustomerRepository, OrderRepository} from '@/core/ports/commerce-repositories'

export interface AccountDeps {
  readonly customers: CustomerRepository
  readonly orders: OrderRepository
  readonly hasher: PasswordHasher
  readonly tokens: SessionTokens
  readonly session: SessionStore
  readonly now?: () => Date
}

export interface RegisterInput {
  readonly name: string
  readonly phone: string
  readonly email: string | null
  readonly password: string
}

export interface LoginInput {
  readonly phone: string
  readonly password: string
}

export type RegisterCustomer = (input: RegisterInput) => Promise<CustomerAccount>
export type LoginCustomer = (input: LoginInput) => Promise<CustomerAccount>
export type LogoutCustomer = () => Promise<void>
export type GetCurrentCustomer = () => Promise<CustomerAccount | null>
export type RequireCustomer = () => Promise<CustomerAccount>
export type ListMyOrders = () => Promise<readonly PlacedOrder[]>
export type UpdateMyProfile = (changes: {name: string; email: string | null}) => Promise<CustomerAccount>

/**
 * A real scrypt-shaped hash that no password produces, so an unknown phone
 * costs the same verification time as a wrong password.
 */
const DUMMY_HASH =
  'scrypt$16384$8$1$5a7a2b1c9d8e7f6a5b4c3d2e1f0a9b8c$' +
  '0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0' +
  '0f1e2d3c4b5a69788796a5b4c3d2e1f0'

/**
 * Accounts are phone plus password, stored on the customer record in the
 * private dataset. Sessions are opaque signed tokens in an httpOnly cookie.
 *
 * Login failures never say whether the phone exists, and a dummy hash check
 * runs even for unknown phones so timing does not reveal it either. When no
 * session secret is configured, "who is signed in" answers nobody rather than
 * failing, so guest checkout keeps working.
 */
export function makeAccountUseCases({
  customers,
  orders,
  hasher,
  tokens,
  session,
  now = () => new Date(),
}: AccountDeps) {
  async function currentAccount(): Promise<CustomerAccount | null> {
    const token = await session.current()
    if (!token) return null
    let parsed
    try {
      parsed = await tokens.verify(token)
    } catch (error) {
      if (error instanceof AuthUnavailableError) return null
      throw error
    }
    if (!parsed || !isSessionLive(parsed, now().getTime())) return null
    const record = await customers.findById(parsed.customerId)
    return record ? {id: record.id, name: record.name, phone: record.phone, email: record.email} : null
  }

  const registerCustomer: RegisterCustomer = async (input) => {
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      throw new OrderValidationError([
        {field: 'password', message: `Use at least ${MIN_PASSWORD_LENGTH} characters.`},
      ])
    }
    const existing = await customers.findCredentialsByPhone(input.phone)
    if (existing?.passwordHash) throw new PhoneAlreadyRegisteredError()

    const passwordHash = await hasher.hash(input.password)
    const record = await customers.register({
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash,
    })
    await session.set(await tokens.issue(record.id))
    await customers.recordLogin(record.id, now())
    return {id: record.id, name: record.name, phone: record.phone, email: record.email}
  }

  const loginCustomer: LoginCustomer = async (input) => {
    const credentials = await customers.findCredentialsByPhone(input.phone)
    const ok = await hasher.verify(input.password, credentials?.passwordHash ?? DUMMY_HASH)
    if (!credentials?.passwordHash || !ok) throw new InvalidCredentialsError()

    await session.set(await tokens.issue(credentials.account.id))
    await customers.recordLogin(credentials.account.id, now())
    return credentials.account
  }

  const logoutCustomer: LogoutCustomer = async () => {
    await session.clear()
  }

  const getCurrentCustomer: GetCurrentCustomer = () => currentAccount()

  const requireCustomer: RequireCustomer = async () => {
    const account = await currentAccount()
    if (!account) throw new NotAuthenticatedError()
    return account
  }

  const listMyOrders: ListMyOrders = async () => {
    const account = await requireCustomer()
    return orders.listByCustomer(account.id)
  }

  const updateMyProfile: UpdateMyProfile = async (changes) => {
    const account = await requireCustomer()
    const record = await customers.updateProfile(account.id, changes)
    return {id: record.id, name: record.name, phone: record.phone, email: record.email}
  }

  return {
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    getCurrentCustomer,
    requireCustomer,
    listMyOrders,
    updateMyProfile,
  }
}
