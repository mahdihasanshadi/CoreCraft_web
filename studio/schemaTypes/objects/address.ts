import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'

export const shippingZones = [
  {title: 'Inside Dhaka', value: 'insideDhaka'},
  {title: 'Outside Dhaka', value: 'outsideDhaka'},
] as const

export const address = defineType({
  name: 'address',
  title: 'Address',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'For example "Home" or "Office".',
    }),
    defineField({
      name: 'fullName',
      title: 'Recipient name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'line1',
      title: 'Address line 1',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'line2', title: 'Address line 2', type: 'string'}),
    defineField({name: 'area', title: 'Area / Thana', type: 'string'}),
    defineField({
      name: 'city',
      title: 'City / District',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'postalCode', title: 'Postal code', type: 'string'}),
    defineField({
      name: 'zone',
      title: 'Delivery zone',
      type: 'string',
      options: {list: [...shippingZones], layout: 'radio'},
      initialValue: 'insideDhaka',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      initialValue: 'Bangladesh',
    }),
  ],
  preview: {
    select: {fullName: 'fullName', line1: 'line1', city: 'city', label: 'label'},
    prepare({fullName, line1, city, label}) {
      return {
        title: [label, fullName].filter(Boolean).join(' · '),
        subtitle: [line1, city].filter(Boolean).join(', '),
      }
    },
  },
})
