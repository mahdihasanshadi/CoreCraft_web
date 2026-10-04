import {defineField, defineType} from 'sanity'
import {PackageIcon} from '@sanity/icons/Package'

/**
 * A snapshot of what was bought, not a reference.
 *
 * Orders live in the private commerce dataset while products live in the
 * public one, so a reference is impossible. More importantly, an order must
 * record the name and price at the moment of purchase, so a later product
 * edit never rewrites history.
 */
export const orderLineItem = defineType({
  name: 'orderLineItem',
  title: 'Line item',
  type: 'object',
  icon: PackageIcon,
  fields: [
    defineField({
      name: 'productId',
      title: 'Product ID',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'productSlug', title: 'Product slug', type: 'string', readOnly: true}),
    defineField({
      name: 'productName',
      title: 'Product',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'variantId', title: 'Variant ID', type: 'string', readOnly: true}),
    defineField({name: 'variantTitle', title: 'Variant', type: 'string'}),
    defineField({name: 'size', title: 'Size', type: 'string'}),
    defineField({name: 'colour', title: 'Colour', type: 'string'}),
    defineField({name: 'sku', title: 'SKU', type: 'string'}),
    defineField({
      name: 'customisation',
      title: 'Print customisation',
      type: 'object',
      description: 'Name and number printed on a jersey, when the shopper asked for it.',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'name', title: 'Name on back', type: 'string'}),
        defineField({name: 'number', title: 'Number', type: 'string'}),
        defineField({
          name: 'fee',
          title: 'Customisation fee',
          type: 'number',
          validation: (rule) => rule.min(0),
        }),
      ],
    }),
    defineField({
      name: 'unitPrice',
      title: 'Unit price',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      initialValue: 1,
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: 'lineTotal',
      title: 'Line total',
      type: 'number',
      description: 'Unit price times quantity, plus any customisation fee.',
      validation: (rule) => rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      productName: 'productName',
      variantTitle: 'variantTitle',
      quantity: 'quantity',
      lineTotal: 'lineTotal',
    },
    prepare({productName, variantTitle, quantity, lineTotal}) {
      return {
        title: `${quantity ?? 1} × ${productName ?? 'Item'}`,
        subtitle: [variantTitle, typeof lineTotal === 'number' ? lineTotal.toLocaleString() : null]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
