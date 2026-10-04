import type {Collection, CollectionSummary} from '@/core/domain/collection'
import type {CurrencyCode} from '@/core/domain/money'
import type {CollectionRepository} from '@/core/ports/collection-repository'

import {sanityFetch} from './live'
import {cleanString, toImageRef, toProductSummary, type RawImage, type RawProductSummary} from './mappers/to-product'
import {COLLECTIONS_QUERY} from './queries'

interface RawCollection {
  _id?: string | null
  title?: string | null
  slug?: string | null
  description?: string | null
  heroImage?: RawImage | null
  products?: (RawProductSummary | null)[] | null
}

function toCollection(raw: RawCollection | null | undefined, currency: CurrencyCode): Collection | null {
  const slug = cleanString(raw?.slug)
  if (!raw?._id || !raw.title || !slug) return null
  const products = Array.isArray(raw.products)
    ? raw.products.flatMap((entry) => {
        const summary = toProductSummary(entry, currency)
        return summary ? [summary] : []
      })
    : []
  return {
    id: raw._id,
    slug,
    title: raw.title,
    description: raw.description ?? null,
    heroImage: toImageRef(raw.heroImage),
    products,
  }
}

export function createSanityCollectionRepository({currency}: {currency: CurrencyCode}): CollectionRepository {
  async function fetchAll(): Promise<readonly Collection[]> {
    const {data} = await sanityFetch({query: COLLECTIONS_QUERY})
    return ((data ?? []) as RawCollection[]).flatMap((entry) => {
      const collection = toCollection(entry, currency)
      return collection ? [collection] : []
    })
  }

  return {
    async listAll(): Promise<readonly CollectionSummary[]> {
      const all = await fetchAll()
      return all.map(({id, slug, title, description, heroImage, products}) => ({
        id,
        slug,
        title,
        description,
        heroImage,
        productCount: products.length,
      }))
    },
    async findBySlug(slug: string): Promise<Collection | null> {
      const all = await fetchAll()
      return all.find((collection) => collection.slug === slug) ?? null
    },
    async listWithProducts(): Promise<readonly Collection[]> {
      const all = await fetchAll()
      return all.filter((collection) => collection.products.length > 0)
    },
  }
}
