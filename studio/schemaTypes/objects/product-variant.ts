import {defineArrayMember, defineField, defineType} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'

export const productVariant = defineType({
  name: 'productVariant',
  title: 'Variant',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Variant name',
      type: 'string',
      description: 'How shoppers see this variant, for example "Large / Charcoal".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
    }),
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
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      description: 'The attributes that make this variant distinct, such as Size or Colour.',
      of: [
        defineArrayMember({
          name: 'option',
          title: 'Option',
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'name', subtitle: 'value'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title', sku: 'sku', stock: 'stock'},
    prepare({title, sku, stock}) {
      const parts = [sku, typeof stock === 'number' ? `${stock} in stock` : null].filter(Boolean)
      return {title, subtitle: parts.join(' · ') || undefined}
    },
  },
})
