import type {Product, ProductSort, ProductSummary, ProductType} from '@/core/domain/product'
import {isInStock} from '@/core/domain/product-rules'
import type {Category} from '@/core/domain/taxonomy'
import type {CategoryRepository} from '@/core/ports/category-repository'
import type {ProductListingFilter, ProductRepository} from '@/core/ports/product-repository'

export interface CatalogueDeps {
  readonly products: ProductRepository
  readonly categories: CategoryRepository
}

export interface ShopListingInput {
  readonly productType: ProductType | null
  readonly categorySlug: string | null
  readonly sort: ProductSort
}

export const NEW_ARRIVALS_LIMIT = 8
export const RELATED_LIMIT = 4
export const SEARCH_LIMIT = 24
export const MIN_SEARCH_LENGTH = 2
export const MAX_SEARCH_LENGTH = 60

/**
 * Turns whatever a person typed into a term the repository can match on.
 * Returns null when there is nothing worth searching for.
 */
export function normaliseSearchTerm(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw
    .replace(/[^\p{L}\p{M}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
  return cleaned.length >= MIN_SEARCH_LENGTH ? cleaned : null
}

export function makeCatalogueUseCases({products, categories}: CatalogueDeps) {
  /** Categories that have something to show, parents before children. */
  async function listCategories(): Promise<readonly Category[]> {
    const all = await categories.listAll()
    return [...all]
      .filter((category) => category.productCount > 0)
      .sort((a, b) => Number(a.parentSlug !== null) - Number(b.parentSlug !== null) || a.title.localeCompare(b.title))
  }

  async function listNewArrivals(): Promise<readonly ProductSummary[]> {
    return products.listNewest(NEW_ARRIVALS_LIMIT)
  }

  async function listRelatedProducts(product: Product): Promise<readonly ProductSummary[]> {
    return products.listRelated(product, RELATED_LIMIT)
  }

  /**
   * The shop listing. "Featured" sort is a business rule layered on top of the
   * repository: featured first, then in stock, then name. Other sorts are
   * passed through because they are plain field orders.
   */
  async function listShop(input: ShopListingInput): Promise<readonly ProductSummary[]> {
    const filter: ProductListingFilter = {
      productType: input.productType,
      categorySlug: input.categorySlug,
      sort: input.sort,
    }
    const found = await products.listFiltered(filter)
    if (input.sort !== 'featured') return found
    return [...found].sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(isInStock(b)) - Number(isInStock(a)) ||
        a.name.localeCompare(b.name),
    )
  }

  async function searchProducts(raw: string | null | undefined): Promise<{
    term: string | null
    results: readonly ProductSummary[]
  }> {
    const term = normaliseSearchTerm(raw)
    if (!term) return {term: null, results: []}
    return {term, results: await products.search(term, SEARCH_LIMIT)}
  }

  return {listCategories, listNewArrivals, listRelatedProducts, listShop, searchProducts}
}
