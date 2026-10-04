import type {NewOrder, OrderCustomer, PlacedOrder} from '../domain/order'
import type {NewProductInterest, NewServiceRequest, Service} from '../domain/service'

export interface CustomerRecord {
  readonly id: string
  readonly name: string
  readonly phone: string
  readonly email: string | null
}

/**
 * Shopper records, matched on phone because that is the identifier people in
 * Bangladesh reliably have and reuse.
 */
export interface CustomerRepository {
  findByPhone(phone: string): Promise<CustomerRecord | null>
  create(customer: OrderCustomer, source: 'storefront'): Promise<CustomerRecord>
}

export interface OrderRepository {
  create(order: NewOrder, customerId: string): Promise<{id: string}>
  findByNumber(orderNumber: string): Promise<PlacedOrder | null>
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
