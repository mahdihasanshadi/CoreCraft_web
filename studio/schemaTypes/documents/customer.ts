import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'

/**
 * A shopper's record, kept in the private commerce dataset.
 *
 * This is a contact and order-history record, not a login. Passwords and
 * sessions belong to an identity provider, never to a content store.
 */
export const customer = defineType({
  name: 'customer',
  title: 'Customer',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'profile', title: 'Profile', default: true},
    {name: 'addresses', title: 'Addresses'},
    {name: 'internal', title: 'Internal'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Full name',
      type: 'string',
      group: 'profile',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'profile',
      description: 'The primary way to reach a shopper in Bangladesh. Used to match repeat orders.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true
          return /^\+?[0-9\s-]{10,16}$/.test(value) || 'Enter a valid phone number.'
        }),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'profile',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'marketingConsent',
      title: 'Marketing consent',
      type: 'string',
      group: 'profile',
      options: {
        list: [
          {title: 'Not asked', value: 'unknown'},
          {title: 'Opted in', value: 'optedIn'},
          {title: 'Opted out', value: 'optedOut'},
        ],
        layout: 'radio',
      },
      initialValue: 'unknown',
    }),
    defineField({
      name: 'addresses',
      title: 'Addresses',
      type: 'array',
      group: 'addresses',
      of: [defineArrayMember({type: 'address'})],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'internal',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      description: 'Free-form labels such as "wholesale" or "VIP".',
    }),
    defineField({
      name: 'notes',
      title: 'Internal notes',
      type: 'text',
      rows: 4,
      group: 'internal',
      description: 'Never shown to the customer.',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'internal',
      readOnly: true,
      options: {
        list: [
          {title: 'Storefront checkout', value: 'storefront'},
          {title: 'Added by staff', value: 'manual'},
        ],
      },
      initialValue: 'manual',
    }),
  ],
  preview: {
    select: {title: 'name', phone: 'phone', email: 'email'},
    prepare({title, phone, email}) {
      return {title, subtitle: [phone, email].filter(Boolean).join(' · ')}
    },
  },
})
