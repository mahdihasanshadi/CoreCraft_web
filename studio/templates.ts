import type {Template} from 'sanity'

import {productTypes} from './schemaTypes/documents/product'

/** Template ID for "new product of this type", shared by config and structure. */
export function productTemplateId(productType: string): string {
  return `product-${productType}`
}

/**
 * One "New …" entry per garment type, so an editor working in the Football
 * jerseys folder gets a jersey with the right fields showing from the first
 * keystroke, instead of a blank product set to T-shirt.
 */
export const productTemplates: Template[] = productTypes
  .filter((entry) => entry.value !== 'other')
  .map((entry) => ({
    id: productTemplateId(entry.value),
    title: `New ${entry.title.toLowerCase()}`,
    schemaType: 'product',
    value: {
      productType: entry.value,
      status: 'draft',
      audience: 'unisex',
      fit: entry.value === 'dropShoulder' ? 'dropShoulder' : 'regular',
      customisable: entry.value === 'footballJersey' || entry.value === 'cricketJersey',
    },
  }))
