import {ProductNotFoundError} from '@/core/domain/errors'
import type {Product} from '@/core/domain/product'
import type {ProductRepository} from '@/core/ports/product-repository'

export interface GetProductDetailDeps {
  readonly products: ProductRepository
}

export type GetProductDetail = (slug: string) => Promise<Product>

/**
 * One product by slug.
 *
 * Turns a missing record into a domain error rather than handing back null.
 * The caller then has one obvious thing to catch, and a forgotten null check
 * cannot quietly render an empty page.
 */
export function makeGetProductDetail({products}: GetProductDetailDeps): GetProductDetail {
  return async function getProductDetail(slug) {
    const trimmed = slug.trim()
    if (!trimmed) throw new ProductNotFoundError(slug)

    const product = await products.findBySlug(trimmed)
    if (!product) throw new ProductNotFoundError(trimmed)

    return product
  }
}
