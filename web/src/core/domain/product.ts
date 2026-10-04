import type {ImageRef} from './image'
import type {Money} from './money'
import type {RichText} from './rich-text'
import type {SeoMetadata} from './seo'
import type {BrandSummary, CategorySummary} from './taxonomy'

export const productStatuses = ['draft', 'active', 'archived'] as const
export type ProductStatus = (typeof productStatuses)[number]

export const productTypes = ['tshirt', 'dropShoulder', 'footballJersey', 'cricketJersey', 'other'] as const
export type ProductType = (typeof productTypes)[number]

export const fits = ['regular', 'oversized', 'dropShoulder', 'slim', 'player'] as const
export type Fit = (typeof fits)[number]

export const audiences = ['unisex', 'men', 'women', 'kids'] as const
export type Audience = (typeof audiences)[number]

export const kitTypes = ['home', 'away', 'third', 'goalkeeper', 'training', 'retro'] as const
export type KitType = (typeof kitTypes)[number]

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value)
}

export const isProductStatus = (value: unknown): value is ProductStatus => isOneOf(productStatuses, value)
export const isProductType = (value: unknown): value is ProductType => isOneOf(productTypes, value)
export const isFit = (value: unknown): value is Fit => isOneOf(fits, value)
export const isAudience = (value: unknown): value is Audience => isOneOf(audiences, value)
export const isKitType = (value: unknown): value is KitType => isOneOf(kitTypes, value)

export function isJerseyType(type: ProductType): boolean {
  return type === 'footballJersey' || type === 'cricketJersey'
}

/** One sellable size-and-colour combination. */
export interface ProductVariant {
  readonly id: string
  readonly size: string
  readonly colour: string | null
  /** Hex such as "#1f2937", for a swatch. */
  readonly colourHex: string | null
  readonly sku: string | null
  /** Null means the variant sells at the product's own price. */
  readonly price: Money | null
  readonly stock: number
}

/** Fields that only make sense for a football or cricket jersey. */
export interface JerseyDetails {
  readonly team: string | null
  readonly season: string | null
  readonly kitType: KitType | null
  /** Whether the shop offers name-and-number printing on this jersey. */
  readonly customisable: boolean
}

export interface Product {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly excerpt: string | null
  readonly description: RichText
  readonly status: ProductStatus
  readonly productType: ProductType
  readonly featured: boolean
  readonly price: Money
  /** The was-price, shown struck through. Null when not on sale. */
  readonly compareAtPrice: Money | null
  readonly sku: string | null
  /** Only meaningful for products without variants. */
  readonly stock: number
  readonly images: readonly ImageRef[]
  readonly fabric: string | null
  readonly gsm: number | null
  readonly fit: Fit | null
  readonly audience: Audience | null
  readonly careInstructions: readonly string[]
  readonly sizeChart: ImageRef | null
  /** Null for anything that is not a jersey. */
  readonly jersey: JerseyDetails | null
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
  readonly productType: ProductType
  readonly featured: boolean
  readonly price: Money
  readonly compareAtPrice: Money | null
  readonly primaryImage: ImageRef | null
  /** Shown on hover, typically the back view. */
  readonly secondaryImage: ImageRef | null
  readonly brand: BrandSummary | null
  readonly stock: number
  readonly variants: readonly Pick<ProductVariant, 'stock' | 'colourHex' | 'colour' | 'size'>[]
}

/** Sort orders a listing can ask for. A business vocabulary, not a GROQ one. */
export const productSorts = ['featured', 'newest', 'priceAsc', 'priceDesc'] as const
export type ProductSort = (typeof productSorts)[number]
export const isProductSort = (value: unknown): value is ProductSort => isOneOf(productSorts, value)
