import type {CartItem} from '@/core/domain/cart'
import {OrderValidationError} from '@/core/domain/errors'
import {createMoney, type Money} from '@/core/domain/money'
import {generateOrderNumber, totalsFor, type Address, type NewOrder, type OrderCustomer} from '@/core/domain/order'
import {shippingFeeFor, type PaymentMethod} from '@/core/domain/site-settings'
import type {CustomerRepository, OrderRepository} from '@/core/ports/commerce-repositories'
import type {PaymentGateway, PaymentOutcome} from '@/core/ports/payment-gateway'
import type {SiteSettingsRepository} from '@/core/ports/site-settings-repository'

import type {QuoteCart} from './quote-cart'

export interface PlaceOrderInput {
  readonly items: readonly CartItem[]
  readonly customer: OrderCustomer
  /** Set when the shopper is signed in; the order attaches to that account. */
  readonly customerId: string | null
  readonly shippingAddress: Address
  readonly paymentMethod: PaymentMethod
  readonly customerNote: string | null
}

export interface PlaceOrderResult {
  readonly orderId: string
  readonly orderNumber: string
  readonly total: Money
  readonly payment: PaymentOutcome
}

export interface PlaceOrderDeps {
  readonly quoteCart: QuoteCart
  readonly customers: CustomerRepository
  readonly orders: OrderRepository
  readonly settings: SiteSettingsRepository
  readonly gateways: readonly PaymentGateway[]
  readonly now?: () => Date
}

export type PlaceOrder = (input: PlaceOrderInput) => Promise<PlaceOrderResult>

/**
 * Turns a bag into a saved order.
 *
 * Pricing is delegated to the same quote the cart page used, so the number
 * the shopper agreed to is the number recorded. Any problem in the quote
 * refuses the whole order; a partial order is never placed silently.
 */
export function makePlaceOrder({
  quoteCart,
  customers,
  orders,
  settings: settingsRepository,
  gateways,
  now = () => new Date(),
}: PlaceOrderDeps): PlaceOrder {
  return async function placeOrder(input) {
    const settings = await settingsRepository.get()
    const problems: {field: string; message: string}[] = []

    if (input.items.length === 0) {
      problems.push({field: 'items', message: 'Your bag is empty.'})
    }
    if (!settings.enabledPaymentMethods.includes(input.paymentMethod)) {
      problems.push({field: 'paymentMethod', message: 'That payment method is not available right now.'})
    }
    const gateway = gateways.find((candidate) => candidate.supports.includes(input.paymentMethod))
    if (!gateway) {
      problems.push({field: 'paymentMethod', message: 'That payment method is not set up yet.'})
    }

    const quote = await quoteCart(input.items, settings)
    for (const problem of quote.problems) {
      problems.push({field: `items.${problem.key}`, message: problem.message})
    }

    if (problems.length > 0 || !gateway) {
      throw new OrderValidationError(problems)
    }

    const lines = quote.lines.map((line) => line.orderLine)
    const shippingFee = shippingFeeFor(settings, input.shippingAddress.zone, quote.subtotal)
    const totals = totalsFor(lines, shippingFee, createMoney(0, quote.currency))

    const placedAt = now()
    const order: NewOrder = {
      orderNumber: generateOrderNumber(placedAt),
      placedAt,
      customer: input.customer,
      lines,
      totals,
      shippingAddress: input.shippingAddress,
      payment: {
        method: input.paymentMethod,
        status: input.paymentMethod === 'cod' ? 'unpaid' : 'pending',
        reference: null,
        senderNumber: null,
      },
      customerNote: input.customerNote,
    }

    const customerId =
      input.customerId ??
      ((await customers.findByPhone(input.customer.phone)) ?? (await customers.create(input.customer, 'storefront'))).id

    const {id: orderId} = await orders.create(order, customerId)
    const payment = await gateway.begin(order, settings)

    return {orderId, orderNumber: order.orderNumber, total: totals.total, payment}
  }
}
