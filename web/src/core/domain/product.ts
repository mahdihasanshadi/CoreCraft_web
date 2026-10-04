import type {ImageRef} from './image'
import type {Money} from './money'
import type {RichText} from './rich-text'
import type {SeoMetadata} from './seo'
import type {BrandSummary, CategorySummary} from './taxonomy'

export const productStatuses = ['draft', 'active', 'archived'] as const

export type ProductStatus = (typeof productStatuses)[number]

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === 'string' && (productStatuses as readonly string[]).includes(value)
}

/** One distinguishing attribute of a variant, such as Size or Colour. */
export interface VariantOption {
  readonly name: string
  readonly value: string
}

export interface ProductVariant {
  readonly id: string
  readonly title: string
  readonly sku: string | null
  /** Null means the variant sells at the product's own price. */
  readonly price: Money | null
  readonly stock: number
  readonly options: readonly VariantOption[]
}

export interface Product {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly excerpt: string | null
  readonly description: RichText
  readonly status: ProductStatus
  readonly price: Money
  /** The was-price, shown struck through. Null when not on sale. */
  readonly compareAtPrice: Money | null
  readonly sku: string | null
  /** Only meaningful for products without variants. */
  readonly stock: number
  readonly images: readonly ImageRef[]
  readonly brand: BrandSummary | null
  readonly categories: readonly CategorySummary[]
  readonly variants: readonly ProductVariant[]
  readonly seo: SeoMetadata
}

/** A product reduced to what a listing card needs. */
export interface ProductSummary {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly excerpt: string | null
  readonly price: Money
  readonly compareAtPrice: Money | null
  readonly primaryImage: ImageRef | null
  readonly brand: BrandSummary | null
  readonly stock: number
  readonly variants: readonly Pick<ProductVariant, 'stock'>[]
}
