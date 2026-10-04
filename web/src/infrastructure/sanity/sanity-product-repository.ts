import {stegaClean} from 'next-sanity'

import type {CurrencyCode} from '@/core/domain/money'
import type {Product, ProductSort, ProductSummary} from '@/core/domain/product'
import type {SeoMetadata} from '@/core/domain/seo'
import type {ProductListingFilter, ProductRepository} from '@/core/ports/product-repository'

import {sanityFetch} from './live'
import {
  toProduct,
  toProductSeo,
  toProductSummary,
  type RawProduct,
  type RawProductSummary,
} from './mappers/to-product'
import {
  FILTERED_PRODUCTS_BY_NAME_QUERY,
  FILTERED_PRODUCTS_NEWEST_QUERY,
  FILTERED_PRODUCTS_PRICE_ASC_QUERY,
  FILTERED_PRODUCTS_PRICE_DESC_QUERY,
  NEWEST_PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SEO_BY_SLUG_QUERY,
  PURCHASABLE_PRODUCTS_QUERY,
  PURCHASABLE_PRODUCT_SLUGS_QUERY,
  RELATED_PRODUCTS_QUERY,
  SEARCH_PRODUCTS_QUERY,
} from './queries'

export interface SanityProductRepositoryDeps {
  readonly currency: CurrencyCode
}

/** Each sort is its own query because GROQ cannot take an order direction as a parameter. */
const FILTERED_QUERY_BY_SORT = {
  featured: FILTERED_PRODUCTS_BY_NAME_QUERY,
  newest: FILTERED_PRODUCTS_NEWEST_QUERY,
  priceAsc: FILTERED_PRODUCTS_PRICE_ASC_QUERY,
  priceDesc: FILTERED_PRODUCTS_PRICE_DESC_QUERY,
} as const satisfies Record<ProductSort, string>

/**
 * The Sanity-backed implementation of the domain's product port.
 *
 * Its whole job is fetch, then translate. No business rule lives here, and
 * nothing Sanity-shaped escapes past the mappers.
 */
export function createSanityProductRepository({currency}: SanityProductRepositoryDeps): ProductRepository {
  function summaries(data: unknown): readonly ProductSummary[] {
    const raw = (data ?? []) as RawProductSummary[]
    return raw.flatMap((entry) => {
      const summary = toProductSummary(entry, currency)
      return summary ? [summary] : []
    })
  }

  return {
    async listPurchasable() {
      const {data} = await sanityFetch({query: PURCHASABLE_PRODUCTS_QUERY})
      return summaries(data)
    },

    async listFiltered(filter: ProductListingFilter) {
      const {data} = await sanityFetch({
        query: FILTERED_QUERY_BY_SORT[filter.sort],
        params: {type: filter.productType, category: filter.categorySlug},
      })
      return summaries(data)
    },

    async listNewest(limit: number) {
      const {data} = await sanityFetch({query: NEWEST_PRODUCTS_QUERY})
      return summaries(data).slice(0, limit)
    },

    async listRelated(product: Product, limit: number) {
      const {data} = await sanityFetch({
        query: RELATED_PRODUCTS_QUERY,
        params: {
          id: product.id,
          type: product.productType,
          categories: product.categories.map((category) => category.slug),
        },
      })
      return summaries(data).slice(0, limit)
    },

    async search(term: string, limit: number) {
      // Prefix-match each word so "arg jer" finds "Argentina ... Jersey".
      const groqTerm = term
        .split(' ')
        .filter(Boolean)
        .map((word) => `${word}*`)
      const {data} = await sanityFetch({query: SEARCH_PRODUCTS_QUERY, params: {term: groqTerm}})
      return summaries(data).slice(0, limit)
    },

    async findBySlug(slug: string): Promise<Product | null> {
      const {data} = await sanityFetch({query: PRODUCT_BY_SLUG_QUERY, params: {slug}})
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
