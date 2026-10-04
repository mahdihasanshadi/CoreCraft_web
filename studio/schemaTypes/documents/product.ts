import {defineArrayMember, defineField, defineType} from 'sanity'
import {PackageIcon} from '@sanity/icons/Package'

export const productTypes = [
  {title: 'T-shirt', value: 'tshirt'},
  {title: 'Drop shoulder', value: 'dropShoulder'},
  {title: 'Football jersey', value: 'footballJersey'},
  {title: 'Cricket jersey', value: 'cricketJersey'},
  {title: 'Other', value: 'other'},
] as const

export const fits = [
  {title: 'Regular', value: 'regular'},
  {title: 'Oversized', value: 'oversized'},
  {title: 'Drop shoulder', value: 'dropShoulder'},
  {title: 'Slim', value: 'slim'},
  {title: 'Player fit', value: 'player'},
] as const

export const audiences = [
  {title: 'Unisex', value: 'unisex'},
  {title: 'Men', value: 'men'},
  {title: 'Women', value: 'women'},
  {title: 'Kids', value: 'kids'},
] as const

const isJersey = (type: unknown) => type === 'footballJersey' || type === 'cricketJersey'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'details', title: 'Fabric & fit'},
    {name: 'commerce', title: 'Pricing & stock'},
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
      name: 'productType',
      title: 'Product type',
      type: 'string',
      group: 'content',
      options: {list: [...productTypes], layout: 'radio'},
      initialValue: 'tshirt',
      validation: (rule) => rule.required(),
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
          fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Feature on home page',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),

    defineField({
      name: 'fabric',
      title: 'Fabric',
      type: 'string',
      group: 'details',
      description: 'For example "100% combed cotton" or "Polyester mesh, moisture-wicking".',
    }),
    defineField({
      name: 'gsm',
      title: 'Fabric weight (GSM)',
      type: 'number',
      group: 'details',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'fit',
      title: 'Fit',
      type: 'string',
      group: 'details',
      options: {list: [...fits], layout: 'radio'},
      initialValue: 'regular',
    }),
    defineField({
      name: 'audience',
      title: 'Made for',
      type: 'string',
      group: 'details',
      options: {list: [...audiences], layout: 'radio'},
      initialValue: 'unisex',
    }),
    defineField({
      name: 'careInstructions',
      title: 'Care instructions',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({type: 'string'})],
      description: 'One instruction per line, for example "Machine wash cold".',
    }),
    defineField({
      name: 'sizeChart',
      title: 'Size chart',
      type: 'image',
      group: 'details',
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
    defineField({
      name: 'team',
      title: 'Team or club',
      type: 'string',
      group: 'details',
      hidden: ({document}) => !isJersey(document?.productType),
    }),
    defineField({
      name: 'season',
      title: 'Season',
      type: 'string',
      group: 'details',
      description: 'For example "2025/26" or "World Cup 2026".',
      hidden: ({document}) => !isJersey(document?.productType),
    }),
    defineField({
      name: 'kitType',
      title: 'Kit',
      type: 'string',
      group: 'details',
      options: {
        list: [
          {title: 'Home', value: 'home'},
          {title: 'Away', value: 'away'},
          {title: 'Third', value: 'third'},
          {title: 'Goalkeeper', value: 'goalkeeper'},
          {title: 'Training', value: 'training'},
          {title: 'Retro', value: 'retro'},
        ],
      },
      hidden: ({document}) => !isJersey(document?.productType),
    }),
    defineField({
      name: 'customisable',
      title: 'Offer name and number printing',
      type: 'boolean',
      group: 'details',
      initialValue: false,
      description: 'The fee is set once in Site settings.',
      hidden: ({document}) => !isJersey(document?.productType),
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
    defineField({name: 'sku', title: 'SKU', type: 'string', group: 'commerce'}),
    defineField({
      name: 'stock',
      title: 'Stock on hand',
      type: 'number',
      group: 'commerce',
      initialValue: 0,
      description: 'Only used when the product has no variants. Variants track their own stock.',
      validation: (rule) => rule.min(0).integer(),
      hidden: ({document}) => Array.isArray(document?.variants) && document.variants.length > 0,
    }),
    defineField({
      name: 'variants',
      title: 'Sizes and colours',
      type: 'array',
      group: 'commerce',
      of: [defineArrayMember({type: 'productVariant'})],
      validation: (rule) =>
        rule.custom((variants) => {
          if (!Array.isArray(variants)) return true
          const seen = new Set<string>()
          for (const variant of variants as {size?: string; colour?: string}[]) {
            const key = `${variant.size ?? ''}|${(variant.colour ?? '').trim().toLowerCase()}`
            if (seen.has(key)) return `Duplicate variant: ${variant.size} / ${variant.colour ?? 'no colour'}.`
            seen.add(key)
          }
          return true
        }),
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
    defineField({name: 'seo', type: 'seo', group: 'seo'}),
  ],
  orderings: [
    {title: 'Name', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
    {title: 'Price, low to high', name: 'priceAsc', by: [{field: 'price', direction: 'asc'}]},
    {title: 'Price, high to low', name: 'priceDesc', by: [{field: 'price', direction: 'desc'}]},
    {title: 'Newest', name: 'createdDesc', by: [{field: '_createdAt', direction: 'desc'}]},
  ],
  preview: {
    select: {
      title: 'name',
      status: 'status',
      price: 'price',
      productType: 'productType',
      media: 'images.0',
    },
    prepare({title, status, price, productType, media}) {
      const typeLabel = productTypes.find((entry) => entry.value === productType)?.title
      const parts = [
        status && status !== 'active' ? status.toUpperCase() : null,
        typeLabel,
        typeof price === 'number' ? `৳${price.toLocaleString()}` : null,
      ].filter(Boolean)
      return {title, subtitle: parts.join(' · ') || undefined, media}
    },
  },
})
