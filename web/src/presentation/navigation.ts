import type {ProductType} from '@/core/domain/product'

import {productTypeLabels} from './view-models/product-card'

/** Garment types in the order the header and shop filters show them. */
export const SHOP_TYPES: readonly ProductType[] = ['tshirt', 'dropShoulder', 'footballJersey', 'cricketJersey']

/** Short header labels; the full names stay on chips and cards. */
const headerLabels: Record<ProductType, string> = {
  tshirt: 'T-shirts',
  dropShoulder: 'Drop shoulder',
  footballJersey: 'Football',
  cricketJersey: 'Cricket',
  other: productTypeLabels.other,
}

export function shopHref(type: ProductType | null, extra: Record<string, string | null> = {}): string {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  for (const [key, value] of Object.entries(extra)) if (value) params.set(key, value)
  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}

export interface NavigationItem {
  readonly href: string
  readonly label: string
  /** Items that only fit from the large breakpoint up. */
  readonly secondary?: boolean
}

export const primaryNavigation: readonly NavigationItem[] = [
  {href: '/shop', label: 'Shop'},
  ...SHOP_TYPES.map((type) => ({href: shopHref(type), label: headerLabels[type], secondary: true})),
  {href: '/services', label: 'Custom kits'},
]
