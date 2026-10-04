import {defineArrayMember, defineField, defineType} from 'sanity'
import {WrenchIcon} from '@sanity/icons/Wrench'

/**
 * Something the brand does to order rather than sells off the shelf: custom
 * team kits, bulk corporate tees, name and number printing.
 */
export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  icon: WrenchIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Offered', value: 'active'},
          {title: 'Paused', value: 'paused'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'One or two sentences for cards.',
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
    defineField({
      name: 'startingPrice',
      title: 'Starting price',
      type: 'number',
      description: 'Shown as "from". Leave empty for quote-only services.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'minimumQuantity',
      title: 'Minimum quantity',
      type: 'number',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'turnaroundDays',
      title: 'Typical turnaround (days)',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {
    select: {title: 'title', status: 'status', media: 'image'},
    prepare({title, status, media}) {
      return {title, subtitle: status === 'active' ? 'Offered' : status, media}
    },
  },
})
