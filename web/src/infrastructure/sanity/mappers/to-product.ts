import {stegaClean} from 'next-sanity'

import {createImageRef, type FocalPoint, type ImageRef} from '@/core/domain/image'
import {createMoney, type CurrencyCode, type Money} from '@/core/domain/money'
import {
  isProductStatus,
  type Product,
  type ProductStatus,
  type ProductSummary,
  type ProductVariant,
  type VariantOption,
} from '@/core/domain/product'
import type {RichText} from '@/core/domain/rich-text'
import {emptySeoMetadata, type SeoMetadata} from '@/core/domain/seo'
import type {BrandSummary, CategorySummary} from '@/core/domain/taxonomy'

/**
 * The shapes the GROQ projections in `queries.ts` return.
 *
 * Declared here rather than imported from generated types so the translation
 * contract is explicit and the mapper stays readable. Everything is optional
 * because content can always be half-filled in a draft.
 */

interface RawImage {
  assetId?: string | null
  alt?: string | null
  hotspot?: {x?: number | null; y?: number | null} | null
}

interface RawBrand {
  name?: string | null
  slug?: string | null
}

interface RawCategory {
  _id?: string | null
  title?: string | null
  slug?: string | null
}

interface RawVariantOption {
  name?: string | null
  value?: string | null
}

interface RawVariant {
  _key?: string | null
  title?: string | null
  sku?: string | null
  price?: number | null
  stock?: number | null
  options?: (RawVariantOption | null)[] | null
}

interface RawSeo {
  title?: string | null
  description?: string | null
  shareImage?: RawImage | null
}

export interface RawProductSummary {
  _id?: string | null
  name?: string | null
  slug?: string | null
  excerpt?: string | null
  price?: number | null
  compareAtPrice?: number | null
  stock?: number | null
  primaryImage?: RawImage | null
  brand?: RawBrand | null
  variants?: ({stock?: number | null} | null)[] | null
}

export interface RawProduct extends RawProductSummary {
  description?: unknown
  status?: string | null
  sku?: string | null
  images?: (RawImage | null)[] | null
  categories?: (RawCategory | null)[] | null
  variants?: (RawVariant | null)[] | null
  seo?: RawSeo | null
}

/**
 * Strings that feed logic or URLs must have Visual Editing's invisible marker
 * characters stripped, or comparisons fail and links break. Display strings
 * keep theirs so click-to-edit still works.
 */
function cleanString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const cleaned = stegaClean(value)
  return cleaned.length > 0 ? cleaned : null
}

function toNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toMoney(value: number | null | undefined, currency: CurrencyCode): Money | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return createMoney(value, currency)
}

function toFocalPoint(hotspot: RawImage['hotspot']): FocalPoint | null {
  const x = hotspot?.x
  const y = hotspot?.y
  if (typeof x !== 'number' || typeof y !== 'number') return null
  return {x, y}
}

function toImageRef(raw: RawImage | null | undefined): ImageRef | null {
  const assetId = cleanString(raw?.assetId)
  if (!assetId) return null
  return createImageRef(assetId, raw?.alt ?? null, toFocalPoint(raw?.hotspot))
}

function toImageRefs(raw: (RawImage | null)[] | null | undefined): readonly ImageRef[] {
  if (!Array.isArray(raw)) return []
  return raw.map(toImageRef).filter((image): image is ImageRef => image !== null)
}

function toBrandSummary(raw: RawBrand | null | undefined): BrandSummary | null {
  const slug = cleanString(raw?.slug)
  if (!raw?.name || !slug) return null
  return {name: raw.name, slug}
}

function toCategorySummaries(
  raw: (RawCategory | null)[] | null | undefined,
): readonly CategorySummary[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    const slug = cleanString(entry?.slug)
    if (!entry?._id || !entry.title || !slug) return []
    return [{id: entry._id, title: entry.title, slug}]
  })
}

function toVariantOptions(
  raw: (RawVariantOption | null)[] | null | undefined,
): readonly VariantOption[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) =>
    entry?.name && entry.value ? [{name: entry.name, value: entry.value}] : [],
  )
}

function toVariants(
  raw: (RawVariant | null)[] | null | undefined,
  currency: CurrencyCode,
): readonly ProductVariant[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((entry) => {
    const id = cleanString(entry?._key)
    if (!entry || !id || !entry.title) return []
    const variant: ProductVariant = {
      id,
      title: entry.title,
      sku: entry.sku ?? null,
      price: toMoney(entry.price, currency),
      stock: toNumber(entry.stock),
      options: toVariantOptions(entry.options),
    }
    return [variant]
  })
}

function toSeoMetadata(raw: RawSeo | null | undefined): SeoMetadata {
  if (!raw) return emptySeoMetadata
  return {
    title: raw.title ?? null,
    description: raw.description ?? null,
    shareImage: toImageRef(raw.shareImage),
  }
}

function toStatus(raw: string | null | undefined): ProductStatus {
  const cleaned = cleanString(raw)
  return isProductStatus(cleaned) ? cleaned : 'draft'
}

/**
 * Returns null when a record lacks the identity or price a product needs, so
 * an incomplete draft is skipped instead of crashing a listing.
 */
export function toProductSummary(
  raw: RawProductSummary | null | undefined,
  currency: CurrencyCode,
): ProductSummary | null {
  const slug = cleanString(raw?.slug)
  const price = toMoney(raw?.price, currency)
  if (!raw?._id || !raw.name || !slug || !price) return null

  return {
    id: raw._id,
    slug,
    name: raw.name,
    excerpt: raw.excerpt ?? null,
    price,
    compareAtPrice: toMoney(raw.compareAtPrice, currency),
    primaryImage: toImageRef(raw.primaryImage),
    brand: toBrandSummary(raw.brand),
    stock: toNumber(raw.stock),
    variants: Array.isArray(raw.variants)
      ? raw.variants.map((variant) => ({stock: toNumber(variant?.stock)}))
      : [],
  }
}

export function toProduct(
  raw: RawProduct | null | undefined,
  currency: CurrencyCode,
): Product | null {
  const slug = cleanString(raw?.slug)
  const price = toMoney(raw?.price, currency)
  if (!raw?._id || !raw.name || !slug || !price) return null

  return {
    id: raw._id,
    slug,
    name: raw.name,
    excerpt: raw.excerpt ?? null,
    description: (Array.isArray(raw.description) ? raw.description : []) as RichText,
    status: toStatus(raw.status),
    price,
    compareAtPrice: toMoney(raw.compareAtPrice, currency),
    sku: raw.sku ?? null,
    stock: toNumber(raw.stock),
    images: toImageRefs(raw.images),
    brand: toBrandSummary(raw.brand),
    categories: toCategorySummaries(raw.categories),
    variants: toVariants(raw.variants, currency),
    seo: toSeoMetadata(raw.seo),
  }
}

export function toProductSeo(
  raw: {name?: string | null; excerpt?: string | null; seo?: RawSeo | null} | null | undefined,
): {name: string; seo: SeoMetadata} | null {
  if (!raw?.name) return null
  const seo = toSeoMetadata(raw.seo)
  return {
    name: raw.name,
    // Fall back to the editorial excerpt when no meta description is set.
    seo: {...seo, description: seo.description ?? raw.excerpt ?? null},
  }
}
