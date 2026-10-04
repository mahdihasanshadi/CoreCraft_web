import {brand} from './documents/brand'
import {category} from './documents/category'
import {collection} from './documents/collection'
import {customer} from './documents/customer'
import {order} from './documents/order'
import {product} from './documents/product'
import {productInterest} from './documents/product-interest'
import {service} from './documents/service'
import {serviceRequest} from './documents/service-request'
import {siteSettings} from './documents/site-settings'
import {address} from './objects/address'
import {orderLineItem} from './objects/order-line-item'
import {paymentDetails} from './objects/payment-details'
import {productVariant} from './objects/product-variant'
import {seo} from './objects/seo'

/**
 * Public catalogue. Lives in the `production` dataset, readable without a
 * token, delivered to the storefront through the CDN.
 */
export const contentTypes = [
  siteSettings,
  product,
  category,
  brand,
  collection,
  service,
  productVariant,
  seo,
]

/**
 * Personal and order data. Lives in the private `commerce` dataset and is
 * only ever read or written with a token on the server.
 */
export const commerceTypes = [
  order,
  customer,
  serviceRequest,
  productInterest,
  orderLineItem,
  paymentDetails,
  address,
]

/** Everything, for TypeGen and any tool that needs the full picture. */
export const schemaTypes = [...contentTypes, ...commerceTypes]
