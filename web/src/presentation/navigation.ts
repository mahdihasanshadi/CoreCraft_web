import type {ProductType} from '@/core/domain/product'

import {productTypeLabels} from './view-models/product-card'

/** Garment types in the order the header and shop filters show them. */
export const SHOP_TYPES: readonly ProductType[] = ['tshirt', 'dropShoulder', 'footballJersey', 'cricketJersey']

export function shopHref(type: ProductType | null, extra: Record<string, string | null> = {}): string {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value)
  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}

export const primaryNavigation = [
  {href: '/shop', label: 'Shop all'},
  ...SHOP_TYPES.map((type) => ({href: shopHref(type), label: productTypeLabels[type]})),
  {href: '/services', label: 'Custom kits'},
] as const
