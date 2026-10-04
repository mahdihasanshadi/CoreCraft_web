import type {CartView} from '@/application/use-cases/cart'
import type {CustomerAccount} from '@/core/domain/account'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'

import {formatMoney} from '../formatting/money'

export interface CartLineViewModel {
  readonly key: string
  readonly href: string
  readonly name: string
  readonly variantLabel: string | null
  readonly printLabel: string | null
  readonly quantity: number
  readonly maxQuantity: number
  readonly unitPriceLabel: string
  readonly lineTotalLabel: string
  readonly image: {readonly src: string; readonly alt: string} | null
  readonly problem: string | null
}

export interface CartViewModel {
  readonly count: number
  readonly lines: readonly CartLineViewModel[]
  /** Lines that could not be priced at all, with the reason. */
  readonly unavailable: readonly {readonly key: string; readonly label: string; readonly reason: string}[]
  readonly subtotalLabel: string
  readonly deliveryInsideLabel: string
  readonly deliveryOutsideLabel: string
  readonly freeDeliveryNudge: string | null
  readonly canCheckout: boolean
}

const CART_IMAGE = 192

export function toCartViewModel(
  view: CartView,
  {images, locale}: {images: ImageUrlResolver; locale: string},
): CartViewModel {
  const problemsByKey = new Map(view.quote.problems.map((problem) => [problem.key, problem.message]))
  const quotedKeys = new Set(view.quote.lines.map((line) => line.key))

  const lines = view.quote.lines.map((line) => {
    const image = line.product.images[0] ?? null
    const available = line.variant ? line.variant.stock : line.product.stock
    const print = line.orderLine.customisation
    return {
      key: line.key,
      href: `/products/${line.product.slug}`,
      name: line.product.name,
      variantLabel: line.orderLine.variantTitle,
      printLabel: print ? `Print: ${[print.name, print.number].filter(Boolean).join(' ')}` : null,
      quantity: line.item.quantity,
      maxQuantity: Math.max(1, Math.min(20, available)),
      unitPriceLabel: formatMoney(line.orderLine.unitPrice, locale),
      lineTotalLabel: formatMoney(line.orderLine.lineTotal, locale),
      image: image
        ? {src: images.resolve(image, {width: CART_IMAGE, height: CART_IMAGE}), alt: image.alt ?? line.product.name}
        : null,
      problem: problemsByKey.get(line.key) ?? null,
    }
  })

  const unavailable = view.cart.items
    .filter((item) => !quotedKeys.has(cartKeyOf(item)))
    .map((item) => ({
      key: cartKeyOf(item),
      label: item.productSlug.replace(/-/g, ' '),
      reason: problemsByKey.get(cartKeyOf(item)) ?? 'This item is no longer available.',
    }))

  return {
    count: view.count,
    lines,
    unavailable,
    subtotalLabel: formatMoney(view.quote.subtotal, locale),
    deliveryInsideLabel: view.deliveryInsideDhaka.amount === 0 ? 'Free' : formatMoney(view.deliveryInsideDhaka, locale),
    deliveryOutsideLabel:
      view.deliveryOutsideDhaka.amount === 0 ? 'Free' : formatMoney(view.deliveryOutsideDhaka, locale),
    freeDeliveryNudge:
      view.amountToFreeDelivery && view.amountToFreeDelivery.amount > 0
        ? `Add ${formatMoney(view.amountToFreeDelivery, locale)} more for free delivery.`
        : view.freeDeliveryFrom && view.quote.subtotal.amount >= view.freeDeliveryFrom.amount && lines.length > 0
          ? 'You have free delivery.'
          : null,
    canCheckout: lines.length > 0 && view.quote.problems.length === 0,
  }
}

function cartKeyOf(item: CartView['cart']['items'][number]): string {
  const print = item.print
  return [item.productSlug, item.variantId ?? '', print?.name ?? '', print?.number ?? ''].join('|')
}

export interface CheckoutViewModel {
  readonly lines: readonly Pick<CartLineViewModel, 'key' | 'name' | 'variantLabel' | 'printLabel' | 'quantity' | 'lineTotalLabel' | 'image'>[]
  readonly subtotalLabel: string
  readonly deliveryInsideLabel: string
  readonly deliveryOutsideLabel: string
  readonly freeDeliveryNudge: string | null
  readonly problems: readonly string[]
  readonly prefill: {readonly name: string; readonly phone: string; readonly email: string}
  readonly signedIn: boolean
}

export function toCheckoutViewModel(
  cart: CartViewModel,
  account: CustomerAccount | null,
): CheckoutViewModel {
  return {
    lines: cart.lines,
    subtotalLabel: cart.subtotalLabel,
    deliveryInsideLabel: cart.deliveryInsideLabel,
    deliveryOutsideLabel: cart.deliveryOutsideLabel,
    freeDeliveryNudge: cart.freeDeliveryNudge,
    problems: [
      ...cart.lines.flatMap((line) => (line.problem ? [line.problem] : [])),
      ...cart.unavailable.map((entry) => entry.reason),
    ],
    prefill: {
      name: account?.name ?? '',
      phone: account?.phone.replace(/^\+88/, '') ?? '',
      email: account?.email ?? '',
    },
    signedIn: account !== null,
  }
}
