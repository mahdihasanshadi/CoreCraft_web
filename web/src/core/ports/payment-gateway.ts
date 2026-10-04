import type {NewOrder} from '../domain/order'
import type {PaymentMethod, SiteSettings} from '../domain/site-settings'

/**
 * What happens after an order is saved, per payment method.
 *
 * - `instructions`: the shopper pays out of band and the team confirms by
 *   hand. Cash on delivery, and mobile wallets or bank transfer without an
 *   API integration, all end here.
 * - `redirect`: a hosted gateway page takes over. Reserved for a provider
 *   integration (bKash merchant API, SSLCommerz, Stripe) once one is chosen.
 */
export type PaymentOutcome =
  | {
      readonly kind: 'instructions'
      readonly title: string
      readonly steps: readonly string[]
      readonly payTo: string | null
    }
  | {readonly kind: 'redirect'; readonly url: string}

export interface PaymentGateway {
  readonly supports: readonly PaymentMethod[]
  begin(order: NewOrder, settings: SiteSettings): Promise<PaymentOutcome>
}
