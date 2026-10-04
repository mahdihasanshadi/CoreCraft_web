import type {ProductCardViewModel} from '../view-models/product-card'
import {ProductCard} from './product-card'
import {SectionHeading, type SectionHeadingProps} from './section-heading'

export interface ProductRailProps extends SectionHeadingProps {
  readonly products: readonly ProductCardViewModel[]
}

/**
 * A horizontally scrolling shelf. On wide screens the first four sit in a
 * row; on phones it snaps card by card. Cards keep the given order.
 */
export function ProductRail({products, ...heading}: ProductRailProps) {
  if (products.length === 0) return null
  return (
    <section aria-labelledby={heading.id} className="mx-auto w-full max-w-6xl px-6">
      <SectionHeading {...heading} />
      <ul className="scroll-rail -mx-6 gap-4 px-6 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
        {products.map((product) => (
          <li key={product.key} className="w-[68vw] shrink-0 sm:w-[40vw] lg:w-auto">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
