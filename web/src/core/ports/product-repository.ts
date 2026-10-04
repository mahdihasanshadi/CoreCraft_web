import type {Product, ProductSummary} from '../domain/product'
import type {SeoMetadata} from '../domain/seo'

/**
 * The domain's view of product storage. Declared here, implemented in the
 * infrastructure layer, so the dependency points inward: nothing in `core`
 * or `application` knows that Sanity exists.
 */
export interface ProductRepository {
  /** Products a shopper is allowed to see, in no particular order. */
  listPurchasable(): Promise<readonly ProductSummary[]>

  findBySlug(slug: string): Promise<Product | null>

  /** Slugs worth prerendering. Published content only. */
  listPurchasableSlugs(): Promise<readonly string[]>

  /**
   * Metadata alone, so a page that only needs a title and description does
   * not pay for the full document.
   */
  findSeoBySlug(slug: string): Promise<{name: string; seo: SeoMetadata} | null>
}
