import type {ProductRepository} from '@/core/ports/product-repository'

export interface ListProductSlugsDeps {
  readonly products: ProductRepository
}

export type ListProductSlugs = () => Promise<readonly string[]>

/**
 * Slugs to prerender. Deduplicated and sorted so the build output is
 * deterministic, which keeps build caches and diffs meaningful.
 */
export function makeListProductSlugs({products}: ListProductSlugsDeps): ListProductSlugs {
  return async function listProductSlugs() {
    const slugs = await products.listPurchasableSlugs()
    return [...new Set(slugs.filter(Boolean))].sort()
  }
}
