import type {Product, ProductSort, ProductSummary, ProductType} from '../domain/product'
import type {SeoMetadata} from '../domain/seo'

export interface ProductListingFilter {
  readonly productType: ProductType | null
  readonly categorySlug: string | null
  readonly sort: ProductSort
}

/**
 * The domain's view of product storage. Declared here, implemented in the
 * infrastructure layer, so the dependency points inward: nothing in `core`
 * or `application` knows that Sanity exists.
 */
export interface ProductRepository {
  /** Products a shopper is allowed to see, in no particular order. */
  listPurchasable(): Promise<readonly ProductSummary[]>

  /** Purchasable products matching a filter, already sorted. */
  listFiltered(filter: ProductListingFilter): Promise<readonly ProductSummary[]>

  /** Most recently added purchasable products. */
  listNewest(limit: number): Promise<readonly ProductSummary[]>

  /** Other purchasable products that share a type or category. */
  listRelated(product: Product, limit: number): Promise<readonly ProductSummary[]>

  /** Full-text match over name, copy, team and fabric. `term` is pre-sanitised. */
  search(term: string, limit: number): Promise<readonly ProductSummary[]>

  findBySlug(slug: string): Promise<Product | null>

  /** Slugs worth prerendering. Published content only. */
  listPurchasableSlugs(): Promise<readonly string[]>

  /**
   * Metadata alone, so a page that only needs a title and description does
   * not pay for the full document.
   */
  findSeoBySlug(slug: string): Promise<{name: string; seo: SeoMetadata} | null>
}
