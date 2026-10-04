import type {ImageRef} from './image'
import type {ProductSummary} from './product'

/**
 * A curated, editor-ordered group of products. Order is meaningful, so the
 * products array preserves exactly what the editor arranged.
 */
export interface Collection {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly description: string | null
  readonly heroImage: ImageRef | null
  readonly products: readonly ProductSummary[]
}

export interface CollectionSummary {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly description: string | null
  readonly heroImage: ImageRef | null
  readonly productCount: number
}
