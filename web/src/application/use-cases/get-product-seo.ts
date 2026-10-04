import type {SeoMetadata} from '@/core/domain/seo'
import type {ProductRepository} from '@/core/ports/product-repository'

export interface GetProductSeoDeps {
  readonly products: ProductRepository
}

export interface ProductSeoResult {
  readonly name: string
  readonly seo: SeoMetadata
}

export type GetProductSeo = (slug: string) => Promise<ProductSeoResult | null>

/**
 * Metadata for a product page.
 *
 * Returns null instead of throwing: a missing product should render a 404
 * page, and failing metadata generation would replace that with a 500.
 */
export function makeGetProductSeo({products}: GetProductSeoDeps): GetProductSeo {
  return async function getProductSeo(slug) {
    const trimmed = slug.trim()
    if (!trimmed) return null
    return products.findSeoBySlug(trimmed)
  }
}
