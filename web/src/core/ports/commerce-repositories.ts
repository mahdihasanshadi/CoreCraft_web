import type {CustomerAccount} from '../domain/account'
import type {NewOrder, OrderCustomer, PlacedOrder} from '../domain/order'
import type {NewProductInterest, NewServiceRequest, Service} from '../domain/service'

export interface CustomerRecord {
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly email: string | null
}

/** A record plus the one secret the login flow needs. Never leaves the use case. */
export interface CustomerCredentials {
  readonly account: CustomerAccount
  readonly passwordHash: string | null
}

export interface NewCustomerAccount {
  readonly name: string
  readonly phone: string
  readonly email: string | null
  readonly passwordHash: string
}

/**
 * Shopper records, matched on phone because that is the identifier people in
 * Bangladesh reliably have and reuse. A guest who later registers with the
 * same phone takes over the existing record and its order history.
 */
export interface CustomerRepository {
  findById(id: string): Promise<CustomerRecord | null>
  findByPhone(phone: string): Promise<CustomerRecord | null>
  findCredentialsByPhone(phone: string): Promise<CustomerCredentials | null>
  create(customer: OrderCustomer, source: 'storefront'): Promise<CustomerRecord>
  /** Creates a record, or attaches a password to a guest record with no account yet. */
  register(account: NewCustomerAccount): Promise<CustomerRecord>
  recordLogin(id: string, at: Date): Promise<void>
  updateProfile(id: string, changes: {name?: string; email?: string | null}): Promise<CustomerRecord>
}

export interface OrderRepository {
  create(order: NewOrder, customerId: string): Promise<{id: string}>
  findByNumber(orderNumber: string): Promise<PlacedOrder | null>
  listByCustomer(customerId: string): Promise<readonly PlacedOrder[]>
}

export interface ServiceRequestRepository {
  create(request: NewServiceRequest): Promise<{id: string}>
}

export interface ProductInterestRepository {
  record(interest: NewProductInterest): Promise<{id: string}>
}

export interface ServiceRepository {
  listOffered(): Promise<readonly Service[]>
  findBySlug(slug: string): Promise<Service | null>
}
