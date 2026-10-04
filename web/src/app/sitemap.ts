import type {MetadataRoute} from 'next'

import {services, useCases} from '@/composition/container'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = services.storefront.siteUrl
  const slugs = await useCases.listProductSlugs()
  const now = new Date()

  return [
    {url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1},
    {url: `${base}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.6},
    ...slugs.map((slug) => ({
      url: `${base}/products/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
