import type {MetadataRoute} from 'next'

import {services} from '@/composition/container'

export default function robots(): MetadataRoute.Robots {
  const base = services.storefront.siteUrl
  return {
    rules: [{userAgent: '*', allow: '/', disallow: ['/checkout', '/api/']}],
    sitemap: `${base}/sitemap.xml`,
  }
}
