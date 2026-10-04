import {brand} from './documents/brand'
import {category} from './documents/category'
import {collection} from './documents/collection'
import {product} from './documents/product'
import {productVariant} from './objects/product-variant'
import {seo} from './objects/seo'

export const schemaTypes = [
  // Documents
  product,
  category,
  brand,
  collection,
  // Objects
  productVariant,
  seo,
]
