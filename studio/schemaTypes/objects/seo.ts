import {defineField, defineType} from 'sanity'
import {SearchIcon} from '@sanity/icons/Search'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'title',
      title: 'Meta title',
      type: 'string',
      description: 'Overrides the document title in search results and browser tabs.',
      validation: (rule) => rule.max(60).warning('Keep meta titles under 60 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(160).warning('Keep meta descriptions under 160 characters.'),
    }),
    defineField({
      name: 'image',
      title: 'Social share image',
      type: 'image',
      options: {hotspot: true, aiAssist: {imageDescriptionField: 'alt'}},
    }),
  ],
})
