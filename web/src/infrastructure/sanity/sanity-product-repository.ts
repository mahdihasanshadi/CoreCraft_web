import {stegaClean} from 'next-sanity'

import type {CurrencyCode} from '@/core/domain/money'
import type {Product, ProductSummary} from '@/core/domain/product'
import type {SeoMetadata} from '@/core/domain/seo'
import type {ProductRepository} from '@/core/ports/product-repository'

import {sanityFetch} from './live'
import {
  toProduct,
  toProductSeo,
  toProductSummary,
  type RawProduct,
  type RawProductSummary,
} from './mappers/to-product'
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SEO_BY_SLUG_QUERY,
  PURCHASABLE_PRODUCTS_QUERY,
  PURCHASABLE_PRODUCT_SLUGS_QUERY,
} from './queries'

export interface SanityProductRepositoryDeps {
  readonly currency: CurrencyCode
}

/**
 * The Sanity-backed implementation of the domain's product port.
 *
 * Its whole job is fetch, then translate. No business rule lives here, and
 * nothing Sanity-shaped escapes past the mappers.
 */
export function createSanityProductRepository({
  currency,
}: SanityProductRepositoryDeps): ProductRepository {
  return {
    async listPurchasable(): Promise<readonly ProductSummary[]> {
      const {data} = await sanityFetch({query: PURCHASABLE_PRODUCTS_QUERY})
      const raw = (data ?? []) as RawProductSummary[]
      return raw.flatMap((entry) => {
        const summary = toProductSummary(entry, currency)
        return summary ? [summary] : []
      })
    },

    async findBySlug(slug: string): Promise<Product | null> {
      const {data} = await sanityFetch({
        query: PRODUCT_BY_SLUG_QUERY,
        params: {slug},
      })
      return toProduct(data as RawProduct | null, currency)
    },

    async listPurchasableSlugs(): Promise<readonly string[]> {
      const {data} = await sanityFetch({
        query: PURCHASABLE_PRODUCT_SLUGS_QUERY,
        // Build-time output: published only, and no Visual Editing markers.
        perspective: 'published',
        stega: false,
      })
      const raw = (data ?? []) as (string | null)[]
      return raw.flatMap((value) => (typeof value === 'string' ? [stegaClean(value)] : []))
    },

    async findSeoBySlug(slug: string): Promise<{name: string; seo: SeoMetadata} | null> {
      const {data} = await sanityFetch({
        query: PRODUCT_SEO_BY_SLUG_QUERY,
        params: {slug},
        // Marker characters must never reach <head>.
        stega: false,
      })
      return toProductSeo(data)
    },
  }
}
