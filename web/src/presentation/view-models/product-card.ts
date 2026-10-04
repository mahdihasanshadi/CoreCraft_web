import {createMoney} from '@/core/domain/money'
import type {ProductSummary, ProductType} from '@/core/domain/product'
import {discountPercentage, isInStock} from '@/core/domain/product-rules'
import type {Category} from '@/core/domain/taxonomy'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'

import {formatMoney} from '../formatting/money'
import type {CategoryTileViewModel} from '../components/category-tiles'

export interface ProductImageViewModel {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export interface SwatchViewModel {
  readonly name: string
  readonly hex: string
}

export interface ProductCardViewModel {
  readonly key: string
  readonly slug: string
  readonly href: string
  readonly name: string
  readonly brandName: string | null
  readonly typeLabel: string
  readonly excerpt: string | null
  readonly priceLabel: string
  readonly compareAtLabel: string | null
  readonly discountLabel: string | null
  /** "Save ৳200", the way local shoppers read a deal. */
  readonly savingsLabel: string | null
  readonly inStock: boolean
  readonly featured: boolean
  readonly image: ProductImageViewModel | null
  /** Swapped in on hover, usually the back view. */
  readonly hoverImage: ProductImageViewModel | null
  /** Distinct colours on offer, for the little dots under the name. */
  readonly swatches: readonly SwatchViewModel[]
  /** Sizes with stock, shown on hover so a shopper can see their size exists. */
  readonly availableSizes: readonly string[]
}

export interface ViewModelContext {
  readonly images: ImageUrlResolver
  readonly locale: string
}

const CARD_IMAGE = {width: 640, height: 800}
const MAX_SWATCHES = 5

export const productTypeLabels: Record<ProductType, string> = {
  tshirt: 'T-shirt',
  dropShoulder: 'Drop shoulder',
  footballJersey: 'Football jersey',
  cricketJersey: 'Cricket jersey',
  other: 'Apparel',
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'ONE']

function swatchesFor(product: ProductSummary): SwatchViewModel[] {
  const seen = new Map<string, string>()
  for (const variant of product.variants) {
    if (variant.colourHex && !seen.has(variant.colourHex)) {
      seen.set(variant.colourHex, variant.colour ?? 'Colour')
    }
  }
  return [...seen.entries()].slice(0, MAX_SWATCHES).map(([hex, name]) => ({hex, name}))
}

function availableSizesFor(product: ProductSummary): string[] {
  const sizes = new Set(product.variants.filter((variant) => variant.stock > 0 && variant.size).map((v) => v.size))
  return [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
}

/**
 * Flattens a product into exactly the strings a card renders.
 *
 * Doing the formatting, URL building and rule evaluation here keeps the
 * components themselves free of domain imports, which means they can be
 * rendered from a fixture in a test or a storybook with no backend at all.
 */
export function toProductCardViewModel(product: ProductSummary, {images, locale}: ViewModelContext): ProductCardViewModel {
  const discount = discountPercentage(product)
  const savings =
    discount !== null && product.compareAtPrice
      ? createMoney(product.compareAtPrice.amount - product.price.amount, product.price.currency)
      : null
  const toImage = (ref: ProductSummary['primaryImage']): ProductImageViewModel | null =>
    ref
      ? {
          src: images.resolve(ref, CARD_IMAGE),
          alt: ref.alt ?? product.name,
          width: CARD_IMAGE.width,
          height: CARD_IMAGE.height,
        }
      : null

  return {
    key: product.id,
    slug: product.slug,
    href: `/products/${product.slug}`,
    name: product.name,
    brandName: product.brand?.name ?? null,
    typeLabel: productTypeLabels[product.productType],
    excerpt: product.excerpt,
    priceLabel: formatMoney(product.price, locale),
    compareAtLabel:
      discount !== null && product.compareAtPrice ? formatMoney(product.compareAtPrice, locale) : null,
    discountLabel: discount !== null ? `-${discount}%` : null,
    savingsLabel: savings ? `Save ${formatMoney(savings, locale)}` : null,
    inStock: isInStock(product),
    featured: product.featured,
    image: toImage(product.primaryImage),
    hoverImage: toImage(product.secondaryImage),
    swatches: swatchesFor(product),
    availableSizes: availableSizesFor(product),
  }
}

const TILE_IMAGE = {width: 640, height: 800}

export function toCategoryTileViewModel(category: Category, {images}: ViewModelContext): CategoryTileViewModel {
  return {
    key: category.id,
    title: category.title,
    href: `/shop?category=${encodeURIComponent(category.slug)}`,
    countLabel: category.productCount === 1 ? '1 style' : `${category.productCount} styles`,
    image: category.image
      ? {src: images.resolve(category.image, TILE_IMAGE), alt: category.image.alt ?? category.title}
      : null,
  }
}
