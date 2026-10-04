import type {ImageRef} from './image'

/** Just enough of a brand to label a product. */
export interface BrandSummary {
  readonly name: string
  readonly slug: string
}

export interface Brand extends BrandSummary {
  readonly id: string
  readonly description: string | null
  readonly logo: ImageRef | null
  readonly website: string | null
}

/** Just enough of a category to tag a product. */
export interface CategorySummary {
  readonly id: string
  readonly title: string
  readonly slug: string
}

export interface Category extends CategorySummary {
  readonly description: string | null
  readonly image: ImageRef | null
  readonly parentSlug: string | null
}
