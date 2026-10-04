import type {ProductSummary, ProductType} from '@/core/domain/product'
import {discountPercentage, isInStock} from '@/core/domain/product-rules'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'

import {formatMoney} from '../formatting/money'

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
  readonly href: string
  readonly name: string
  readonly brandName: string | null
  readonly typeLabel: string
  readonly excerpt: string | null
  readonly priceLabel: string
  readonly compareAtLabel: string | null
  readonly discountLabel: string | null
  readonly inStock: boolean
  readonly featured: boolean
  readonly image: ProductImageViewModel | null
  /** Distinct colours on offer, for the little dots under the name. */
  readonly swatches: readonly SwatchViewModel[]
}

export interface ViewModelContext {
  readonly images: ImageUrlResolver
  readonly locale: string
}

const CARD_IMAGE_SIZE = 640
const MAX_SWATCHES = 5

export const productTypeLabels: Record<ProductType, string> = {
  tshirt: 'T-shirt',
  dropShoulder: 'Drop shoulder',
  footballJersey: 'Football jersey',
  cricketJersey: 'Cricket jersey',
  other: 'Apparel',
}

function swatchesFor(product: ProductSummary): SwatchViewModel[] {
  const seen = new Map<string, string>()
  for (const variant of product.variants) {
    if (variant.colourHex && !seen.has(variant.colourHex)) {
      seen.set(variant.colourHex, variant.colour ?? 'Colour')
    }
  }
  return [...seen.entries()].slice(0, MAX_SWATCHES).map(([hex, name]) => ({hex, name}))
}

/**
 * Flattens a product into exactly the strings a card renders.
 *
 * Doing the formatting, URL building and rule evaluation here keeps the
 * components themselves free of domain imports, which means they can be
 * rendered from a fixture in a test or a storybook with no backend at all.
 */
export function toProductCardViewModel(
  product: ProductSummary,
  {images, locale}: ViewModelContext,
): ProductCardViewModel {
  const discount = discountPercentage(product)

  return {
    key: product.id,
    href: `/products/${product.slug}`,
    name: product.name,
    brandName: product.brand?.name ?? null,
    typeLabel: productTypeLabels[product.productType],
    excerpt: product.excerpt,
    priceLabel: formatMoney(product.price, locale),
    compareAtLabel:
      discount !== null && product.compareAtPrice
        ? formatMoney(product.compareAtPrice, locale)
        : null,
    discountLabel: discount !== null ? `${discount}% off` : null,
    inStock: isInStock(product),
    featured: product.featured,
    image: product.primaryImage
      ? {
          src: images.resolve(product.primaryImage, {
            width: CARD_IMAGE_SIZE,
            height: CARD_IMAGE_SIZE,
          }),
          alt: product.primaryImage.alt ?? product.name,
          width: CARD_IMAGE_SIZE,
          height: CARD_IMAGE_SIZE,
        }
      : null,
    swatches: swatchesFor(product),
  }
}
