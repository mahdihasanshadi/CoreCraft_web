import type {ProductSummary} from '@/core/domain/product'
import {isInStock} from '@/core/domain/product-rules'
import type {ProductRepository} from '@/core/ports/product-repository'

export interface ListStorefrontProductsDeps {
  readonly products: ProductRepository
}

export type ListStorefrontProducts = () => Promise<readonly ProductSummary[]>

/**
 * Products for the storefront listing.
 *
 * The ordering is a business decision rather than a query detail: sold-out
 * items sink below available ones, and ties break alphabetically so the grid
 * is stable between visits. Keeping it here means the rule is tested once and
 * holds no matter which repository backs it.
 */
export function makeListStorefrontProducts({
  products,
}: ListStorefrontProductsDeps): ListStorefrontProducts {
  return async function listStorefrontProducts() {
    const found = await products.listPurchasable()

    return [...found].sort((a, b) => {
      const availability = Number(isInStock(b)) - Number(isInStock(a))
      if (availability !== 0) return availability
      return a.name.localeCompare(b.name)
    })
  }
}
