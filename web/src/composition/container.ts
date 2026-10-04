import {makeGetProductDetail, type GetProductDetail} from '@/application/use-cases/get-product-detail'
import {makeGetProductSeo, type GetProductSeo} from '@/application/use-cases/get-product-seo'
import {makeListProductSlugs, type ListProductSlugs} from '@/application/use-cases/list-product-slugs'
import {
  makeListStorefrontProducts,
  type ListStorefrontProducts,
} from '@/application/use-cases/list-storefront-products'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'
import {storefrontConfig, type StorefrontConfig} from '@/infrastructure/config/env'
import {createSanityImageUrlResolver} from '@/infrastructure/sanity/sanity-image-url-resolver'
import {createSanityProductRepository} from '@/infrastructure/sanity/sanity-product-repository'

/**
 * The composition root.
 *
 * This is the only module that knows both the abstractions and the concrete
 * adapters, which is what keeps every arrow pointing inward everywhere else.
 * Swapping Sanity for another backend means editing this file and adding an
 * adapter, nothing in `core`, `application`, or `presentation`.
 */

const productRepository = createSanityProductRepository({
  currency: storefrontConfig.currency,
})

export interface UseCases {
  readonly listStorefrontProducts: ListStorefrontProducts
  readonly getProductDetail: GetProductDetail
  readonly listProductSlugs: ListProductSlugs
  readonly getProductSeo: GetProductSeo
}

export const useCases: UseCases = {
  listStorefrontProducts: makeListStorefrontProducts({products: productRepository}),
  getProductDetail: makeGetProductDetail({products: productRepository}),
  listProductSlugs: makeListProductSlugs({products: productRepository}),
  getProductSeo: makeGetProductSeo({products: productRepository}),
}

export interface Services {
  readonly imageUrls: ImageUrlResolver
  readonly storefront: StorefrontConfig
}

export const services: Services = {
  imageUrls: createSanityImageUrlResolver(),
  storefront: storefrontConfig,
}
