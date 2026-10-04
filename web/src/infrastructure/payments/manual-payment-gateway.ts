import type {NewOrder} from '@/core/domain/order'
import type {PaymentMethod, SiteSettings} from '@/core/domain/site-settings'
import type {PaymentGateway, PaymentOutcome} from '@/core/ports/payment-gateway'

/**
 * Cash on delivery: nothing to collect online. The shopper pays the courier
 * and the team marks the order paid in the Studio once the cash is in.
 *
 * The store offers only this method today. Settings could re-enable wallet or
 * bank transfer later, and those would need their own adapter here.
 */
export function createCashOnDeliveryGateway(): PaymentGateway {
  const supports: readonly PaymentMethod[] = ['cod']

  return {
    supports,
    async begin(order: NewOrder, settings: SiteSettings): Promise<PaymentOutcome> {
      const amount = order.totals.total.amount.toLocaleString()
      const confirmLine = settings.contactPhone
        ? `We will call from ${settings.contactPhone} to confirm before dispatch.`
        : 'We will call to confirm your order before dispatch.'
      return {
        kind: 'instructions',
        title: 'Pay when it arrives',
        steps: [`Have ৳${amount} ready in cash for the courier.`, confirmLine],
        payTo: null,
      }
    },
  }
}
