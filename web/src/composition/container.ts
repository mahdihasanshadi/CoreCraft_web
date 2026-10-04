import {makeGetProductDetail, type GetProductDetail} from '@/application/use-cases/get-product-detail'
import {makeGetProductSeo, type GetProductSeo} from '@/application/use-cases/get-product-seo'
import {makeGetSiteSettings, type GetSiteSettings} from '@/application/use-cases/get-site-settings'
import {makeListCollections, type ListCollections} from '@/application/use-cases/list-collections'
import {makeListProductSlugs, type ListProductSlugs} from '@/application/use-cases/list-product-slugs'
import {
  makeListStorefrontProducts,
  type ListStorefrontProducts,
} from '@/application/use-cases/list-storefront-products'
import {makePlaceOrder, type PlaceOrder} from '@/application/use-cases/place-order'
import {
  makeRecordProductInterest,
  type RecordProductInterest,
} from '@/application/use-cases/record-product-interest'
import {
  makeGetOrderByNumber,
  makeListServices,
  type GetOrderByNumber,
  type ListServices,
} from '@/application/use-cases/services'
import {
  makeSubmitServiceRequest,
  type SubmitServiceRequest,
} from '@/application/use-cases/submit-service-request'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'
import {storefrontConfig, type StorefrontConfig} from '@/infrastructure/config/env'
import {createManualPaymentGateway} from '@/infrastructure/payments/manual-payment-gateway'
import {createSanityCollectionRepository} from '@/infrastructure/sanity/sanity-collection-repository'
import {
  createSanityCustomerRepository,
  createSanityOrderRepository,
  createSanityProductInterestRepository,
  createSanityServiceRequestRepository,
} from '@/infrastructure/sanity/sanity-commerce-repositories'
import {createSanityImageUrlResolver} from '@/infrastructure/sanity/sanity-image-url-resolver'
import {createSanityProductRepository} from '@/infrastructure/sanity/sanity-product-repository'
import {createSanityServiceRepository} from '@/infrastructure/sanity/sanity-service-repository'
import {createSanitySiteSettingsRepository} from '@/infrastructure/sanity/sanity-site-settings-repository'

/**
 * The composition root.
 *
 * This is the only module that knows both the abstractions and the concrete
 * adapters, which is what keeps every arrow pointing inward everywhere else.
 * Swapping Sanity for another backend, or adding a payment provider, means
 * editing this file and adding an adapter, nothing in `core`, `application`,
 * or `presentation`.
 */

const {currency} = storefrontConfig

const products = createSanityProductRepository({currency})
const collections = createSanityCollectionRepository({currency})
const settings = createSanitySiteSettingsRepository({currency, fallbackStoreName: 'CoreCraft'})
const serviceRepository = createSanityServiceRepository({currency})
const customers = createSanityCustomerRepository()
const orders = createSanityOrderRepository({currency})
const serviceRequests = createSanityServiceRequestRepository()
const productInterest = createSanityProductInterestRepository()

/** Add a provider adapter here when one is chosen; the first match wins. */
const paymentGateways = [createManualPaymentGateway()]

export interface UseCases {
  readonly listStorefrontProducts: ListStorefrontProducts
  readonly listCollections: ListCollections
  readonly getProductDetail: GetProductDetail
  readonly listProductSlugs: ListProductSlugs
  readonly getProductSeo: GetProductSeo
  readonly getSiteSettings: GetSiteSettings
  readonly listServices: ListServices
  readonly placeOrder: PlaceOrder
  readonly getOrderByNumber: GetOrderByNumber
  readonly submitServiceRequest: SubmitServiceRequest
  readonly recordProductInterest: RecordProductInterest
}

export const useCases: UseCases = {
  listStorefrontProducts: makeListStorefrontProducts({products}),
  listCollections: makeListCollections({collections}),
  getProductDetail: makeGetProductDetail({products}),
  listProductSlugs: makeListProductSlugs({products}),
  getProductSeo: makeGetProductSeo({products}),
  getSiteSettings: makeGetSiteSettings({settings}),
  listServices: makeListServices({services: serviceRepository}),
  placeOrder: makePlaceOrder({products, customers, orders, settings, gateways: paymentGateways}),
  getOrderByNumber: makeGetOrderByNumber({orders}),
  submitServiceRequest: makeSubmitServiceRequest({services: serviceRepository, requests: serviceRequests}),
  recordProductInterest: makeRecordProductInterest({products, interest: productInterest}),
}

export interface Services {
  readonly imageUrls: ImageUrlResolver
  readonly storefront: StorefrontConfig
}

export const services: Services = {
  imageUrls: createSanityImageUrlResolver(),
  storefront: storefrontConfig,
}
