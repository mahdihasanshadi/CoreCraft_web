import {makeAccountUseCases} from '@/application/use-cases/accounts'
import {makeCartUseCases} from '@/application/use-cases/cart'
import {makeCatalogueUseCases} from '@/application/use-cases/catalogue'
import {makeGetProductDetail} from '@/application/use-cases/get-product-detail'
import {makeGetProductSeo} from '@/application/use-cases/get-product-seo'
import {makeGetSiteSettings} from '@/application/use-cases/get-site-settings'
import {makeListCollections} from '@/application/use-cases/list-collections'
import {makeListProductSlugs} from '@/application/use-cases/list-product-slugs'
import {makeListStorefrontProducts} from '@/application/use-cases/list-storefront-products'
import {makePlaceOrder} from '@/application/use-cases/place-order'
import {makeQuoteCart} from '@/application/use-cases/quote-cart'
import {makeRecordProductInterest} from '@/application/use-cases/record-product-interest'
import {makeGetOrderByNumber, makeListServices} from '@/application/use-cases/services'
import {makeSubmitServiceRequest} from '@/application/use-cases/submit-service-request'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'
import {authSecret, storefrontConfig, type StorefrontConfig} from '@/infrastructure/config/env'
import {createCookieSessionStore} from '@/infrastructure/auth/cookie-session-store'
import {createHmacSessionTokens} from '@/infrastructure/auth/hmac-session-tokens'
import {createScryptPasswordHasher} from '@/infrastructure/auth/scrypt-password-hasher'
import {createCookieCartStore} from '@/infrastructure/cart/cookie-cart-store'
import {createCashOnDeliveryGateway} from '@/infrastructure/payments/manual-payment-gateway'
import {createSanityCategoryRepository} from '@/infrastructure/sanity/sanity-category-repository'
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

const {currency, secureCookies} = storefrontConfig

const products = createSanityProductRepository({currency})
const categories = createSanityCategoryRepository()
const collections = createSanityCollectionRepository({currency})
const settings = createSanitySiteSettingsRepository({currency, fallbackStoreName: 'CoreCraft'})
const serviceRepository = createSanityServiceRepository({currency})
const customers = createSanityCustomerRepository()
const orders = createSanityOrderRepository({currency})
const serviceRequests = createSanityServiceRequestRepository()
const productInterest = createSanityProductInterestRepository()

const cartStore = createCookieCartStore({secure: secureCookies})
const quoteCart = makeQuoteCart({products, currency})
const cart = makeCartUseCases({cart: cartStore, settings, quoteCart})
const catalogue = makeCatalogueUseCases({products, categories})

const accounts = makeAccountUseCases({
  customers,
  orders,
  hasher: createScryptPasswordHasher(),
  tokens: createHmacSessionTokens({secret: authSecret}),
  session: createCookieSessionStore({secure: secureCookies}),
})

/** Cash on delivery only, by the owner's decision. */
const paymentGateways = [createCashOnDeliveryGateway()]

export const useCases = {
  listStorefrontProducts: makeListStorefrontProducts({products}),
  listCollections: makeListCollections({collections}),
  getProductDetail: makeGetProductDetail({products}),
  listProductSlugs: makeListProductSlugs({products}),
  getProductSeo: makeGetProductSeo({products}),
  getSiteSettings: makeGetSiteSettings({settings}),
  listServices: makeListServices({services: serviceRepository}),
  placeOrder: makePlaceOrder({quoteCart, customers, orders, settings, gateways: paymentGateways}),
  getOrderByNumber: makeGetOrderByNumber({orders}),
  submitServiceRequest: makeSubmitServiceRequest({services: serviceRepository, requests: serviceRequests}),
  recordProductInterest: makeRecordProductInterest({products, interest: productInterest}),
  ...catalogue,
  ...cart,
  ...accounts,
} as const

export type UseCases = typeof useCases

export interface Services {
  readonly imageUrls: ImageUrlResolver
  readonly storefront: StorefrontConfig
  /** True when AUTH_SECRET is set, so pages can hide sign-in when it is not. */
  readonly accountsEnabled: boolean
}

export const services: Services = {
  imageUrls: createSanityImageUrlResolver(),
  storefront: storefrontConfig,
  accountsEnabled: Boolean(authSecret && authSecret.length >= 32),
}
