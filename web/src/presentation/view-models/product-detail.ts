import type {Product} from '@/core/domain/product'
import {
  availableUnits,
  discountPercentage,
  hasPriceRange,
  isInStock,
  lowestPrice,
} from '@/core/domain/product-rules'
import type {RichText} from '@/core/domain/rich-text'

import {formatMoney} from '../formatting/money'
import type {ViewModelContext} from './product-card'

export interface GalleryImageViewModel {
  readonly key: string
  readonly src: string
  readonly thumbnailSrc: string
  readonly alt: string
  readonly width: number
  readonly height: number
}

export interface VariantViewModel {
  readonly id: string
  readonly title: string
  readonly sku: string | null
  readonly priceLabel: string
  readonly inStock: boolean
  readonly stock: number
  /** Options joined for display, such as "Size: L · Colour: Black". */
  readonly optionsLabel: string | null
}

export interface ProductDetailViewModel {
  readonly name: string
  readonly brandName: string | null
  readonly excerpt: string | null
  readonly sku: string | null
  readonly description: RichText
  readonly priceLabel: string
  readonly compareAtLabel: string | null
  readonly discountLabel: string | null
  /** True when variants carry different prices, so the label says "from". */
  readonly priceIsFrom: boolean
  readonly inStock: boolean
  readonly stockLabel: string
  readonly images: readonly GalleryImageViewModel[]
  readonly variants: readonly VariantViewModel[]
  readonly categories: readonly {readonly id: string; readonly title: string}[]
}

const GALLERY_IMAGE_SIZE = 1200
const THUMBNAIL_SIZE = 160
const LOW_STOCK_THRESHOLD = 5

function stockLabelFor(product: Product): string {
  if (!isInStock(product)) return 'Out of stock'
  const units = availableUnits(product)
  if (units <= LOW_STOCK_THRESHOLD) {
    return units === 1 ? 'Only 1 left' : `Only ${units} left`
  }
  return 'In stock'
}

export function toProductDetailViewModel(
  product: Product,
  {images, locale}: ViewModelContext,
): ProductDetailViewModel {
  const discount = discountPercentage(product)
  const priceIsFrom = hasPriceRange(product)
  const displayPrice = priceIsFrom ? lowestPrice(product) : product.price

  return {
    name: product.name,
    brandName: product.brand?.name ?? null,
    excerpt: product.excerpt,
    sku: product.sku,
    description: product.description,
    priceLabel: formatMoney(displayPrice, locale),
    compareAtLabel:
      discount !== null && product.compareAtPrice
        ? formatMoney(product.compareAtPrice, locale)
        : null,
    discountLabel: discount !== null ? `${discount}% off` : null,
    priceIsFrom,
    inStock: isInStock(product),
    stockLabel: stockLabelFor(product),
    images: product.images.map((image, index) => ({
      key: `${image.assetId}-${index}`,
      src: images.resolve(image, {width: GALLERY_IMAGE_SIZE, height: GALLERY_IMAGE_SIZE}),
      thumbnailSrc: images.resolve(image, {width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE}),
      alt: image.alt ?? `${product.name}, image ${index + 1}`,
      width: GALLERY_IMAGE_SIZE,
      height: GALLERY_IMAGE_SIZE,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      priceLabel: formatMoney(variant.price ?? product.price, locale),
      inStock: variant.stock > 0,
      stock: variant.stock,
      optionsLabel:
        variant.options.length > 0
          ? variant.options.map((option) => `${option.name}: ${option.value}`).join(' · ')
          : null,
    })),
    categories: product.categories.map(({id, title}) => ({id, title})),
  }
}
