import type {NewOrder} from '@/core/domain/order'
import type {PaymentMethod, SiteSettings} from '@/core/domain/site-settings'
import type {PaymentGateway, PaymentOutcome} from '@/core/ports/payment-gateway'

/**
 * Payments the team confirms by hand.
 *
 * Cash on delivery needs nothing from the shopper. Mobile wallets and bank
 * transfer give the shopper the merchant details and ask for a transaction ID,
 * which the team matches against their wallet statement before marking the
 * order paid in the Studio. A gateway integration would replace this adapter
 * for the methods it covers, without touching the use case.
 */
export function createManualPaymentGateway(): PaymentGateway {
  const supports: readonly PaymentMethod[] = ['cod', 'bkash', 'nagad', 'bankTransfer']

  return {
    supports,
    async begin(order: NewOrder, settings: SiteSettings): Promise<PaymentOutcome> {
      const amount = order.totals.total.amount.toLocaleString()
      const {paymentInstructions} = settings

      switch (order.payment.method) {
        case 'cod':
          return {
            kind: 'instructions',
            title: 'Pay when it arrives',
            steps: [
              `Have ৳${amount} ready in cash for the courier.`,
              'We will call to confirm your order before dispatch.',
            ],
            payTo: null,
          }
        case 'bkash':
          return {
            kind: 'instructions',
            title: 'Send payment with bKash',
            steps: [
              `Send Money ৳${amount} to the merchant number below.`,
              `Use ${order.orderNumber} as the reference.`,
              'Reply to our confirmation call or WhatsApp with the transaction ID.',
            ],
            payTo: paymentInstructions.bkashNumber,
          }
        case 'nagad':
          return {
            kind: 'instructions',
            title: 'Send payment with Nagad',
            steps: [
              `Send Money ৳${amount} to the merchant number below.`,
              `Use ${order.orderNumber} as the reference.`,
              'Reply to our confirmation call or WhatsApp with the transaction ID.',
            ],
            payTo: paymentInstructions.nagadNumber,
          }
        case 'bankTransfer':
          return {
            kind: 'instructions',
            title: 'Pay by bank transfer',
            steps: [
              `Transfer ৳${amount} to the account below.`,
              `Quote ${order.orderNumber} in the transfer note.`,
              'Dispatch happens once the transfer clears.',
            ],
            payTo: paymentInstructions.bankDetails,
          }
        default:
          throw new Error(`Manual gateway cannot handle ${order.payment.method}`)
      }
    },
  }
}
