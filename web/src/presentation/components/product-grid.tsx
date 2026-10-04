import type {ProductCardViewModel} from '../view-models/product-card'
import {ProductCard} from './product-card'

export function ProductGrid({products}: {products: readonly ProductCardViewModel[]}) {
  return (
    <ul
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
      aria-label="Products"
    >
      {products.map((product) => (
        <li key={product.key}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
