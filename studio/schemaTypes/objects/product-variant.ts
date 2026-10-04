import {defineField, defineType} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'

export const sizes = [
  {title: 'XS', value: 'XS'},
  {title: 'S', value: 'S'},
  {title: 'M', value: 'M'},
  {title: 'L', value: 'L'},
  {title: 'XL', value: 'XL'},
  {title: 'XXL', value: 'XXL'},
  {title: '3XL', value: '3XL'},
  {title: 'One size', value: 'ONE'},
] as const

/**
 * One sellable combination of size and colour.
 *
 * Explicit size and colour fields beat a generic options list for apparel:
 * the storefront can render a real size selector and colour swatches, and
 * editors get a dropdown instead of free text that drifts between "L" and
 * "Large".
 */
export const productVariant = defineType({
  name: 'productVariant',
  title: 'Variant',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {list: [...sizes]},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'colour',
      title: 'Colour',
      type: 'string',
      description: 'As shoppers see it, for example "Charcoal" or "Home red".',
    }),
    defineField({
      name: 'colourHex',
      title: 'Colour swatch',
      type: 'string',
      description: 'Hex code for the swatch, for example #1f2937.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) || 'Use a hex code like #1f2937.'
        }),
    }),
    defineField({name: 'sku', title: 'SKU', type: 'string'}),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Leave empty to inherit the product price.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'stock',
      title: 'Stock on hand',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.required().min(0).integer(),
    }),
  ],
  preview: {
    select: {size: 'size', colour: 'colour', sku: 'sku', stock: 'stock', colourHex: 'colourHex'},
    prepare({size, colour, sku, stock}) {
      const title = [size, colour].filter(Boolean).join(' / ') || 'Variant'
      const parts = [sku, typeof stock === 'number' ? `${stock} in stock` : null].filter(Boolean)
      return {title, subtitle: parts.join(' · ') || undefined}
    },
  },
})
