import type {Cart} from '../domain/cart'

/**
 * Where the shopper's bag lives between requests. The cookie adapter is the
 * only implementation today; a signed-in customer's server-side bag would be
 * another, behind the same interface.
 */
export interface CartStore {
  read(): Promise<Cart>
  /** Only callable where the platform allows setting cookies: actions and route handlers. */
  write(cart: Cart): Promise<void>
  clear(): Promise<void>
}
