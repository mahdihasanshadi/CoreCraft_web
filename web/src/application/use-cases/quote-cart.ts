import {cartLineKey, type CartItem} from '@/core/domain/cart'
import {createMoney, type Money} from '@/core/domain/money'
import {lineTotalFor, type Customisation, type OrderLine} from '@/core/domain/order'
import type {Product, ProductVariant} from '@/core/domain/product'
import type {SiteSettings} from '@/core/domain/site-settings'
import type {ProductRepository} from '@/core/ports/product-repository'

export interface CartProblem {
  /** The cart line key the problem belongs to, or "cart" for the whole bag. */
  readonly key: string
  readonly message: string
}

/** A cart line resolved against the live catalogue. */
export interface QuotedLine {
  readonly key: string
  readonly item: CartItem
  readonly product: Product
  readonly variant: ProductVariant | null
  readonly orderLine: OrderLine
}

export interface CartQuote {
  readonly lines: readonly QuotedLine[]
  readonly problems: readonly CartProblem[]
  readonly subtotal: Money
  readonly currency: string
}

export interface QuoteCartDeps {
  readonly products: ProductRepository
  readonly currency: string
}

export type QuoteCart = (items: readonly CartItem[], settings: SiteSettings) => Promise<CartQuote>

const MAX_PRINT_NAME_LENGTH = 14

function variantTitle(variant: ProductVariant): string {
  return [variant.size, variant.colour].filter(Boolean).join(' / ')
}

/**
 * The one place a bag is turned into priced lines.
 *
 * Both the cart page and checkout call this, so what the shopper sees as a
 * total is exactly what the order will record. Prices, stock and printing
 * rules all come from the catalogue and settings, never from the request.
 * Lines with problems are reported, not silently dropped, so the cart page
 * can explain and checkout can refuse.
 */
export function makeQuoteCart({products, currency}: QuoteCartDeps): QuoteCart {
  return async function quoteCart(items, settings) {
    const problems: CartProblem[] = []
    const lines: QuotedLine[] = []

    const uniqueSlugs = [...new Set(items.map((item) => item.productSlug))]
    const catalogue = new Map<string, Product | null>()
    await Promise.all(
      uniqueSlugs.map(async (slug) => {
        catalogue.set(slug, await products.findBySlug(slug))
      }),
    )

    for (const item of items) {
      const key = cartLineKey(item)
      const product = catalogue.get(item.productSlug) ?? null

      if (!product || product.status !== 'active') {
        problems.push({key, message: 'This item is no longer available.'})
        continue
      }

      let variant: ProductVariant | null = null
      if (product.variants.length > 0) {
        if (!item.variantId) {
          problems.push({key, message: `Choose a size for ${product.name}.`})
          continue
        }
        variant = product.variants.find((candidate) => candidate.id === item.variantId) ?? null
        if (!variant) {
          problems.push({key, message: `That size of ${product.name} is no longer offered.`})
          continue
        }
      }

      const available = variant ? variant.stock : product.stock
      if (available < item.quantity) {
        problems.push({
          key,
          message:
            available === 0
              ? `${product.name}${variant ? ` (${variantTitle(variant)})` : ''} is sold out.`
              : `Only ${available} of ${product.name}${variant ? ` (${variantTitle(variant)})` : ''} left.`,
        })
        continue
      }

      let customisation: Customisation | null = null
      if (item.print) {
        if (!product.jersey?.customisable) {
          problems.push({key, message: `${product.name} cannot be printed with a name and number.`})
          continue
        }
        if (item.print.name && item.print.name.length > MAX_PRINT_NAME_LENGTH) {
          problems.push({key, message: `Printed names are at most ${MAX_PRINT_NAME_LENGTH} characters.`})
          continue
        }
        if (item.print.number && !/^\d{1,2}$/.test(item.print.number)) {
          problems.push({key, message: 'Printed numbers are 1 or 2 digits.'})
          continue
        }
        customisation = {name: item.print.name, number: item.print.number, fee: settings.jerseyCustomisationFee}
      }

      const unitPrice = variant?.price ?? product.price
      lines.push({
        key,
        item,
        product,
        variant,
        orderLine: {
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          variantId: variant?.id ?? null,
          variantTitle: variant ? variantTitle(variant) : null,
          size: variant?.size ?? null,
          colour: variant?.colour ?? null,
          sku: variant?.sku ?? product.sku,
          unitPrice,
          quantity: item.quantity,
          customisation,
          lineTotal: lineTotalFor(unitPrice, item.quantity, customisation),
        },
      })
    }

    const subtotal = createMoney(
      lines.reduce((sum, line) => sum + line.orderLine.lineTotal.amount, 0),
      currency,
    )

    return {lines, problems, subtotal, currency}
  }
}
