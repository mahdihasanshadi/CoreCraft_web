import type {Category} from '@/core/domain/taxonomy'
import type {CategoryRepository} from '@/core/ports/category-repository'

import {sanityFetch} from './live'
import {cleanString, toImageRef, type RawImage} from './mappers/to-product'
import {CATEGORIES_QUERY} from './queries'

interface RawCategory {
  _id?: string | null
  title?: string | null
  slug?: string | null
  description?: string | null
  image?: RawImage | null
  parentSlug?: string | null
  productCount?: number | null
}

function toCategory(raw: RawCategory | null | undefined): Category | null {
  const slug = cleanString(raw?.slug)
  if (!raw?._id || !raw.title || !slug) return null
  return {
    id: raw._id,
    title: raw.title,
    slug,
    description: raw.description ?? null,
    image: toImageRef(raw.image),
    parentSlug: cleanString(raw.parentSlug),
    productCount: typeof raw.productCount === 'number' ? raw.productCount : 0,
  }
}

export function createSanityCategoryRepository(): CategoryRepository {
  async function listAll(): Promise<readonly Category[]> {
    const {data} = await sanityFetch({query: CATEGORIES_QUERY})
    return ((data ?? []) as RawCategory[]).flatMap((entry) => {
      const category = toCategory(entry)
      return category ? [category] : []
    })
  }

  return {
    listAll,
    async findBySlug(slug: string): Promise<Category | null> {
      const all = await listAll()
      return all.find((category) => category.slug === slug) ?? null
    },
  }
}
