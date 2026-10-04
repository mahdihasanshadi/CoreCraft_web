import type {PlacedOrder} from '@/core/domain/order'
import type {PaymentMethod} from '@/core/domain/site-settings'

import {formatMoney} from '../formatting/money'

export interface OrderConfirmationViewModel {
  readonly orderNumber: string
  readonly placedAtLabel: string
  readonly customerName: string
  readonly statusLabel: string
  readonly lines: readonly {
    readonly key: string
    readonly title: string
    readonly detail: string | null
    readonly quantity: number
    readonly lineTotalLabel: string
  }[]
  readonly subtotalLabel: string
  readonly shippingLabel: string
  readonly discountLabel: string | null
  readonly totalLabel: string
  readonly address: readonly string[]
  readonly paymentMethodLabel: string
  readonly paymentStatusLabel: string
  readonly isCashOnDelivery: boolean
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  card: 'Card',
  bankTransfer: 'Bank transfer',
}

const statusLabels: Record<PlacedOrder['status'], string> = {
  pending: 'Received',
  confirmed: 'Confirmed',
  processing: 'Being prepared',
  shipped: 'With the courier',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

export function toOrderConfirmationViewModel(order: PlacedOrder, locale: string): OrderConfirmationViewModel {
  return {
    orderNumber: order.orderNumber,
    placedAtLabel: new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeStyle: 'short'}).format(order.placedAt),
    customerName: order.customerName,
    statusLabel: statusLabels[order.status],
    lines: order.lines.map((line, index) => ({
      key: `${line.productId}-${line.variantId ?? index}-${index}`,
      title: line.productName,
      detail:
        [
          line.variantTitle,
          line.customisation?.name || line.customisation?.number
            ? `Print: ${[line.customisation.name, line.customisation.number].filter(Boolean).join(' ')}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || null,
      quantity: line.quantity,
      lineTotalLabel: formatMoney(line.lineTotal, locale),
    })),
    subtotalLabel: formatMoney(order.totals.subtotal, locale),
    shippingLabel: order.totals.shippingFee.amount === 0 ? 'Free' : formatMoney(order.totals.shippingFee, locale),
    discountLabel: order.totals.discount.amount > 0 ? formatMoney(order.totals.discount, locale) : null,
    totalLabel: formatMoney(order.totals.total, locale),
    address: [
      order.shippingAddress.fullName,
      order.shippingAddress.line1,
      order.shippingAddress.line2,
      [order.shippingAddress.area, order.shippingAddress.city, order.shippingAddress.postalCode]
        .filter(Boolean)
        .join(', '),
      order.shippingAddress.phone,
    ].filter((line): line is string => Boolean(line)),
    paymentMethodLabel: paymentMethodLabels[order.payment.method],
    paymentStatusLabel: order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1),
    isCashOnDelivery: order.payment.method === 'cod',
  }
}
