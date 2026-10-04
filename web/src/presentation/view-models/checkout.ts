import type {PlacedOrder} from '@/core/domain/order'
import type {Product, ProductVariant} from '@/core/domain/product'
import {lineTotalFor} from '@/core/domain/order'
import type {PaymentMethod, SiteSettings} from '@/core/domain/site-settings'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'

import {formatMoney} from '../formatting/money'

export interface CheckoutItemViewModel {
  readonly productSlug: string
  readonly productName: string
  readonly variantId: string | null
  readonly variantLabel: string | null
  readonly quantity: number
  readonly unitPriceLabel: string
  readonly lineTotalLabel: string
  readonly image: {readonly src: string; readonly alt: string} | null
  readonly customisable: boolean
  readonly customisationFeeLabel: string
}

export interface CheckoutViewModel {
  readonly item: CheckoutItemViewModel
  readonly subtotalLabel: string
  readonly shipping: {
    readonly insideDhakaLabel: string
    readonly outsideDhakaLabel: string
    readonly freeFromLabel: string | null
  }
  readonly paymentMethods: readonly {readonly value: PaymentMethod}[]
}

export function toCheckoutViewModel(
  product: Product,
  variant: ProductVariant | null,
  quantity: number,
  settings: SiteSettings,
  {images, locale}: {images: ImageUrlResolver; locale: string},
): CheckoutViewModel {
  const unitPrice = variant?.price ?? product.price
  const lineTotal = lineTotalFor(unitPrice, quantity, null)
  const primary = product.images[0] ?? null

  return {
    item: {
      productSlug: product.slug,
      productName: product.name,
      variantId: variant?.id ?? null,
      variantLabel: variant ? [variant.size, variant.colour].filter(Boolean).join(' / ') : null,
      quantity,
      unitPriceLabel: formatMoney(unitPrice, locale),
      lineTotalLabel: formatMoney(lineTotal, locale),
      image: primary
        ? {src: images.resolve(primary, {width: 320, height: 320}), alt: primary.alt ?? product.name}
        : null,
      customisable: product.jersey?.customisable ?? false,
      customisationFeeLabel: formatMoney(settings.jerseyCustomisationFee, locale),
    },
    subtotalLabel: formatMoney(lineTotal, locale),
    shipping: {
      insideDhakaLabel: formatMoney(settings.shipping.insideDhaka, locale),
      outsideDhakaLabel: formatMoney(settings.shipping.outsideDhaka, locale),
      freeFromLabel: settings.shipping.freeFrom ? formatMoney(settings.shipping.freeFrom, locale) : null,
    },
    paymentMethods: settings.enabledPaymentMethods.map((value) => ({value})),
  }
}

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
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  card: 'Card',
  bankTransfer: 'Bank transfer',
}

export function toOrderConfirmationViewModel(order: PlacedOrder, locale: string): OrderConfirmationViewModel {
  return {
    orderNumber: order.orderNumber,
    placedAtLabel: new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeStyle: 'short'}).format(order.placedAt),
    customerName: order.customerName,
    statusLabel: order.status.charAt(0).toUpperCase() + order.status.slice(1),
    lines: order.lines.map((line, index) => ({
      key: `${line.productId}-${line.variantId ?? index}`,
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
    shippingLabel:
      order.totals.shippingFee.amount === 0 ? 'Free' : formatMoney(order.totals.shippingFee, locale),
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
  }
}
