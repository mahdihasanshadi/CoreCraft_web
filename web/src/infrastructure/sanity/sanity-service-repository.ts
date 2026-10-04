import type {CurrencyCode} from '@/core/domain/money'
import type {RichText} from '@/core/domain/rich-text'
import type {Service} from '@/core/domain/service'
import type {ServiceRepository} from '@/core/ports/commerce-repositories'

import {sanityFetch} from './live'
import {cleanString, toImageRef, toMoney, type RawImage} from './mappers/to-product'
import {ACTIVE_SERVICES_QUERY} from './queries'

interface RawService {
  _id?: string | null
  title?: string | null
  slug?: string | null
  summary?: string | null
  description?: unknown
  image?: RawImage | null
  startingPrice?: number | null
  minimumQuantity?: number | null
  turnaroundDays?: number | null
}

function toService(raw: RawService | null | undefined, currency: CurrencyCode): Service | null {
  const slug = cleanString(raw?.slug)
  if (!raw?._id || !raw.title || !slug) return null
  return {
    id: raw._id,
    slug,
    title: raw.title,
    summary: raw.summary ?? '',
    description: (Array.isArray(raw.description) ? raw.description : []) as RichText,
    image: toImageRef(raw.image),
    startingPrice: toMoney(raw.startingPrice, currency),
    minimumQuantity: typeof raw.minimumQuantity === 'number' ? raw.minimumQuantity : null,
    turnaroundDays: typeof raw.turnaroundDays === 'number' ? raw.turnaroundDays : null,
  }
}

export function createSanityServiceRepository({currency}: {currency: CurrencyCode}): ServiceRepository {
  async function listOffered(): Promise<readonly Service[]> {
    const {data} = await sanityFetch({query: ACTIVE_SERVICES_QUERY})
    return ((data ?? []) as RawService[]).flatMap((entry) => {
      const service = toService(entry, currency)
      return service ? [service] : []
    })
  }

  return {
    listOffered,
    async findBySlug(slug: string): Promise<Service | null> {
      const all = await listOffered()
      return all.find((service) => service.slug === slug) ?? null
    },
  }
}
