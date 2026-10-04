import {isGreaterThan, type Money} from './money'
import type {Product, ProductVariant} from './product'

/**
 * The shape the stock and pricing rules actually need. Writing the rules
 * against this instead of `Product` lets them serve listing summaries too,
 * without either type depending on the other.
 */
export interface Priced {
  readonly price: Money
  readonly compareAtPrice: Money | null
}

export interface Stocked {
  readonly stock: number
  readonly variants: readonly Pick<ProductVariant, 'stock'>[]
}

/**
 * A product with variants is in stock when any variant is. Without variants,
 * its own stock count decides. This is the single place that rule lives.
 */
export function isInStock(item: Stocked): boolean {
  if (item.variants.length > 0) {
    return item.variants.some((variant) => variant.stock > 0)
  }
  return item.stock > 0
}

/** Total units available across variants, or the product's own stock. */
export function availableUnits(item: Stocked): number {
  if (item.variants.length > 0) {
    return item.variants.reduce((total, variant) => total + Math.max(0, variant.stock), 0)
  }
  return Math.max(0, item.stock)
}

export function isOnSale(item: Priced): boolean {
  return item.compareAtPrice !== null && isGreaterThan(item.compareAtPrice, item.price)
}

/**
 * Whole-percent discount, rounded. Null when the item is not on sale, so
 * callers cannot accidentally render "0% off".
 */
export function discountPercentage(item: Priced): number | null {
  if (!isOnSale(item) || item.compareAtPrice === null) return null
  const {amount: was} = item.compareAtPrice
  const {amount: now} = item.price
  if (was <= 0) return null
  return Math.round(((was - now) / was) * 100)
}

/** What a shopper pays for a given variant, falling back to the product price. */
export function priceFor(product: Product, variant: ProductVariant | null): Money {
  return variant?.price ?? product.price
}

/** The cheapest price on offer, used when a listing shows "from X". */
export function lowestPrice(product: Product): Money {
  return product.variants.reduce<Money>((cheapest, variant) => {
    const candidate = variant.price
    if (candidate === null) return cheapest
    return isGreaterThan(cheapest, candidate) ? candidate : cheapest
  }, product.price)
}

/** True when variants disagree on price, so a listing should say "from". */
export function hasPriceRange(product: Product): boolean {
  return product.variants.some(
    (variant) => variant.price !== null && variant.price.amount !== product.price.amount,
  )
}
