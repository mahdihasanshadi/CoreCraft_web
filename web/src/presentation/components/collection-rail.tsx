import type {ProductCardViewModel} from '../view-models/product-card'
import {ProductCard} from './product-card'

export interface CollectionRailProps {
  readonly title: string
  readonly description: string | null
  readonly products: readonly ProductCardViewModel[]
}

/**
 * A horizontally scrolling shelf for a curated collection. Cards keep the
 * editor's order; on wide screens the first four sit in a row.
 */
export function CollectionRail({title, description, products}: CollectionRailProps) {
  if (products.length === 0) return null
  const headingId = `collection-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Collection</p>
        <h2 id={headingId} className="text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description && <p className="max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      <ul className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:thin] lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {products.map((product) => (
          <li key={product.key} className="w-[72vw] shrink-0 snap-start sm:w-[44vw] lg:w-auto">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
