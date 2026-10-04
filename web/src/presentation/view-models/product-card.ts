import type {ProductSummary} from '@/core/domain/product'
import {discountPercentage, isInStock} from '@/core/domain/product-rules'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'

import {formatMoney} from '../formatting/money'

export interface ProductImageViewModel {
  readonly src: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export interface ProductCardViewModel {
  readonly key: string
  readonly href: string
  readonly name: string
  readonly brandName: string | null
  readonly excerpt: string | null
  readonly priceLabel: string
  readonly compareAtLabel: string | null
  readonly discountLabel: string | null
  readonly inStock: boolean
  readonly image: ProductImageViewModel | null
}

export interface ViewModelContext {
  readonly images: ImageUrlResolver
  readonly locale: string
}

const CARD_IMAGE_SIZE = 640

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
    excerpt: product.excerpt,
    priceLabel: formatMoney(product.price, locale),
    compareAtLabel:
      discount !== null && product.compareAtPrice
        ? formatMoney(product.compareAtPrice, locale)
        : null,
    discountLabel: discount !== null ? `${discount}% off` : null,
    inStock: isInStock(product),
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
  }
}
