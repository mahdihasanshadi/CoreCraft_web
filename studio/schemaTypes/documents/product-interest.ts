import {defineField, defineType} from 'sanity'
import {HeartIcon} from '@sanity/icons/Heart'

export const interestKinds = [
  {title: 'Notify me when back in stock', value: 'notifyMe'},
  {title: 'Saved to wishlist', value: 'wishlist'},
  {title: 'Enquiry', value: 'enquiry'},
] as const

/**
 * One shopper signal about one product, written by the storefront.
 *
 * Product identity is snapshotted because this lives in the private dataset
 * and cannot reference the public catalogue. The Studio aggregates these per
 * product in the "Insights" view on each product document.
 */
export const productInterest = defineType({
  name: 'productInterest',
  title: 'Product interest',
  type: 'document',
  icon: HeartIcon,
  fields: [
    defineField({
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {list: [...interestKinds], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
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
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'variantId', title: 'Variant ID', type: 'string', readOnly: true, hidden: true}),
    defineField({name: 'size', title: 'Size wanted', type: 'string', readOnly: true}),
    defineField({name: 'colour', title: 'Colour wanted', type: 'string', readOnly: true}),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({name: 'note', title: 'Note', type: 'text', rows: 3}),
    defineField({
      name: 'handled',
      title: 'Handled',
      type: 'string',
      options: {
        list: [
          {title: 'Open', value: 'open'},
          {title: 'Notified', value: 'notified'},
          {title: 'Closed', value: 'closed'},
        ],
        layout: 'radio',
      },
      initialValue: 'open',
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'submittedAtDesc', by: [{field: 'submittedAt', direction: 'desc'}]},
    {title: 'By product', name: 'productName', by: [{field: 'productName', direction: 'asc'}]},
  ],
  preview: {
    select: {productName: 'productName', kind: 'kind', size: 'size', phone: 'phone', email: 'email'},
    prepare({productName, kind, size, phone, email}) {
      const kindLabel = interestKinds.find((entry) => entry.value === kind)?.title ?? kind
      return {
        title: [productName, size].filter(Boolean).join(' · '),
        subtitle: [kindLabel, phone ?? email].filter(Boolean).join(' · '),
      }
    },
  },
})
