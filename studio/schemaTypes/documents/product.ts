import {defineArrayMember, defineField, defineType} from 'sanity'
import {PackageIcon} from '@sanity/icons/Package'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'commerce', title: 'Commerce'},
    {name: 'organisation', title: 'Organisation'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'name', maxLength: 96},
      validation: (rule) =>
        rule.required().custom(async (slug, context) => {
          if (!slug?.current) return true
          const client = context.getClient({apiVersion: '2026-10-04'})
          const id = context.document?._id?.replace(/^drafts\./, '') ?? ''
          const duplicates = await client.fetch<number>(
            `count(*[_type == "product" && slug.current == $slug && !(_id in [$id, "drafts." + $id])])`,
            {slug: slug.current, id},
          )
          return duplicates === 0 || 'Another product already uses this slug.'
        }),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative text',
              type: 'string',
              description: 'Describe the image for screen readers and search engines.',
            }),
          ],
        }),
      ],
      validation: (rule) => rule.min(1).warning('Products sell better with at least one image.'),
    }),
    defineField({
      name: 'excerpt',
      title: 'Short description',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'One or two sentences for cards and listings.',
      validation: (rule) => rule.max(240).warning('Keep it under 240 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative text',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'commerce',
      initialValue: 'draft',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Active', value: 'active'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'commerce',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare-at price',
      type: 'number',
      group: 'commerce',
      description: 'The original price, shown struck through when a product is on sale.',
      validation: (rule) =>
        rule.min(0).custom((compareAtPrice, context) => {
          const price = context.document?.price
          if (
            typeof compareAtPrice === 'number' &&
            typeof price === 'number' &&
            compareAtPrice <= price
          ) {
            return 'Compare-at price must be higher than the price.'
          }
          return true
        }),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      group: 'commerce',
    }),
    defineField({
      name: 'stock',
      title: 'Stock on hand',
      type: 'number',
      group: 'commerce',
      initialValue: 0,
      description: 'Ignored when the product has variants, which track their own stock.',
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      group: 'commerce',
      of: [defineArrayMember({type: 'productVariant'})],
    }),
    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'reference',
      group: 'organisation',
      to: [{type: 'brand'}],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'organisation',
      of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      status: 'status',
      price: 'price',
      media: 'images.0',
    },
    prepare({title, status, price, media}) {
      const parts = [
        status && status !== 'active' ? status.toUpperCase() : null,
        typeof price === 'number' ? price.toLocaleString() : null,
      ].filter(Boolean)
      return {title, subtitle: parts.join(' · ') || undefined, media}
    },
  },
})
