import type {Audience, Fit, KitType, Product} from '@/core/domain/product'
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
  readonly size: string
  readonly colour: string | null
  readonly colourHex: string | null
  readonly sku: string | null
  readonly priceLabel: string
  readonly inStock: boolean
  readonly stock: number
}

export interface SpecViewModel {
  readonly label: string
  readonly value: string
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
  readonly specs: readonly SpecViewModel[]
  readonly careInstructions: readonly string[]
  readonly sizeChart: {readonly src: string; readonly alt: string} | null
  readonly jerseyBadge: string | null
  readonly customisable: boolean
  readonly categories: readonly {readonly id: string; readonly title: string}[]
}

const GALLERY_IMAGE_SIZE = 1200
const THUMBNAIL_SIZE = 160
const SIZE_CHART_WIDTH = 1200
const LOW_STOCK_THRESHOLD = 5

const fitLabels: Record<Fit, string> = {
  regular: 'Regular fit',
  oversized: 'Oversized',
  dropShoulder: 'Drop shoulder',
  slim: 'Slim fit',
  player: 'Player fit',
}

const audienceLabels: Record<Audience, string> = {
  unisex: 'Unisex',
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
}

const kitLabels: Record<KitType, string> = {
  home: 'Home kit',
  away: 'Away kit',
  third: 'Third kit',
  goalkeeper: 'Goalkeeper kit',
  training: 'Training kit',
  retro: 'Retro kit',
}

function stockLabelFor(product: Product): string {
  if (!isInStock(product)) return 'Out of stock'
  const units = availableUnits(product)
  if (units <= LOW_STOCK_THRESHOLD) {
    return units === 1 ? 'Only 1 left' : `Only ${units} left`
  }
  return 'In stock'
}

function specsFor(product: Product): SpecViewModel[] {
  const specs: SpecViewModel[] = []
  if (product.fabric) specs.push({label: 'Fabric', value: product.fabric})
  if (product.gsm !== null) specs.push({label: 'Weight', value: `${product.gsm} GSM`})
  if (product.fit) specs.push({label: 'Fit', value: fitLabels[product.fit]})
  if (product.audience) specs.push({label: 'Made for', value: audienceLabels[product.audience]})
  if (product.jersey?.team) specs.push({label: 'Team', value: product.jersey.team})
  if (product.jersey?.season) specs.push({label: 'Season', value: product.jersey.season})
  if (product.jersey?.kitType) specs.push({label: 'Kit', value: kitLabels[product.jersey.kitType]})
  return specs
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
      size: variant.size,
      colour: variant.colour,
      colourHex: variant.colourHex,
      sku: variant.sku,
      priceLabel: formatMoney(variant.price ?? product.price, locale),
      inStock: variant.stock > 0,
      stock: variant.stock,
    })),
    specs: specsFor(product),
    careInstructions: product.careInstructions,
    sizeChart: product.sizeChart
      ? {
          src: images.resolve(product.sizeChart, {width: SIZE_CHART_WIDTH}),
          alt: product.sizeChart.alt ?? `${product.name} size chart`,
        }
      : null,
    jerseyBadge: product.jersey
      ? [product.jersey.team, product.jersey.kitType ? kitLabels[product.jersey.kitType] : null]
          .filter(Boolean)
          .join(' · ') || null
      : null,
    customisable: product.jersey?.customisable ?? false,
    categories: product.categories.map(({id, title}) => ({id, title})),
  }
}
