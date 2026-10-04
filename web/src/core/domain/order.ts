import {createMoney, type Money} from './money'
import type {PaymentMethod, ShippingZone} from './site-settings'

export const orderStatuses = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const paymentStatuses = ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof paymentStatuses)[number]

export interface Address {
  readonly fullName: string
  readonly phone: string
  readonly line1: string
  readonly line2: string | null
  readonly area: string | null
  readonly city: string
  readonly postalCode: string | null
  readonly zone: ShippingZone
  readonly country: string
}

/** A printed name and number on a jersey. */
export interface Customisation {
  readonly name: string | null
  readonly number: string | null
  readonly fee: Money
}

/**
 * A line is a snapshot. Product name and price are copied at purchase time so
 * a later catalogue edit can never change what a customer was charged.
 */
export interface OrderLine {
  readonly productId: string
  readonly productSlug: string
  readonly productName: string
  readonly variantId: string | null
  readonly variantTitle: string | null
  readonly size: string | null
  readonly colour: string | null
  readonly sku: string | null
  readonly unitPrice: Money
  readonly quantity: number
  readonly customisation: Customisation | null
  readonly lineTotal: Money
}

export interface OrderTotals {
  readonly subtotal: Money
  readonly shippingFee: Money
  readonly discount: Money
  readonly total: Money
}

export interface OrderCustomer {
  readonly name: string
  readonly phone: string
  readonly email: string | null
}

export interface OrderPayment {
  readonly method: PaymentMethod
  readonly status: PaymentStatus
  readonly reference: string | null
  readonly senderNumber: string | null
}

/** Everything needed to persist an order. Built only by the place-order use case. */
export interface NewOrder {
  readonly orderNumber: string
  readonly placedAt: Date
  readonly customer: OrderCustomer
  readonly lines: readonly OrderLine[]
  readonly totals: OrderTotals
  readonly shippingAddress: Address
  readonly payment: OrderPayment
  readonly customerNote: string | null
}

/** What the shopper sees after placing an order. */
export interface PlacedOrder {
  readonly id: string
  readonly orderNumber: string
  readonly placedAt: Date
  readonly status: OrderStatus
  readonly customerName: string
  readonly lines: readonly OrderLine[]
  readonly totals: OrderTotals
  readonly shippingAddress: Address
  readonly payment: OrderPayment
}

export function lineTotalFor(unitPrice: Money, quantity: number, customisation: Customisation | null): Money {
  const fee = customisation ? customisation.fee.amount : 0
  return createMoney((unitPrice.amount + fee) * quantity, unitPrice.currency)
}

export function totalsFor(lines: readonly OrderLine[], shippingFee: Money, discount: Money): OrderTotals {
  const currency = shippingFee.currency
  const subtotalAmount = lines.reduce((sum, line) => sum + line.lineTotal.amount, 0)
  const subtotal = createMoney(subtotalAmount, currency)
  const totalAmount = Math.max(0, subtotal.amount + shippingFee.amount - discount.amount)
  return {subtotal, shippingFee, discount, total: createMoney(totalAmount, currency)}
}

const ORDER_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Human-readable, date-prefixed, with a short random suffix from an alphabet
 * that avoids look-alike characters. Example: CC-261004-K7Q2.
 */
export function generateOrderNumber(now: Date, random: () => number = Math.random): string {
  const yy = String(now.getUTCFullYear()).slice(-2)
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  let suffix = ''
  for (let index = 0; index < 4; index += 1) {
    suffix += ORDER_NUMBER_ALPHABET[Math.floor(random() * ORDER_NUMBER_ALPHABET.length)]
  }
  return `CC-${yy}${mm}${dd}-${suffix}`
}
