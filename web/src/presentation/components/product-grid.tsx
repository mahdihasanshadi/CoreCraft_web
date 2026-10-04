import type {ProductCardViewModel} from '../view-models/product-card'
import {ProductCard} from './product-card'

/** Two across on phones like the local shops people know, four on desktop. */
export function ProductGrid({products}: {products: readonly ProductCardViewModel[]}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6" aria-label="Products">
      {products.map((product) => (
        <li key={product.key}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
