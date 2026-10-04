import {defineArrayMember, defineField, defineType} from 'sanity'
import {UserIcon} from '@sanity/icons/User'

/**
 * A shopper's record, kept in the private commerce dataset.
 *
 * Also the account: when a shopper registers on the storefront, a password
 * hash is stored under `auth`. Staff never see the hash; the Studio hides it.
 * Phone is the login identifier, which is why it is required and unique.
 */
export const customer = defineType({
  name: 'customer',
  title: 'Customer',
  type: 'document',
  icon: UserIcon,
  groups: [
    {name: 'profile', title: 'Profile', default: true},
    {name: 'addresses', title: 'Addresses'},
    {name: 'account', title: 'Account'},
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
      description:
        'Primary contact and the sign-in identifier. Stored as +880… Used to match repeat orders.',
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          if (!value) return true
          if (!/^\+?[0-9\s-]{10,16}$/.test(value)) return 'Enter a valid phone number.'
          const client = context.getClient({apiVersion: '2026-10-04'})
          const id = context.document?._id?.replace(/^drafts\./, '') ?? ''
          const duplicates = await client.fetch<number>(
            `count(*[_type == "customer" && phone == $phone && !(_id in [$id, "drafts." + $id])])`,
            {phone: value, id},
          )
          return duplicates === 0 || 'Another customer already has this phone number.'
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
      name: 'auth',
      title: 'Account',
      type: 'object',
      group: 'account',
      description: 'Managed by the storefront. A customer without these fields has never registered.',
      readOnly: true,
      fields: [
        defineField({
          name: 'passwordHash',
          title: 'Password hash',
          type: 'string',
          hidden: true,
        }),
        defineField({name: 'accountCreatedAt', title: 'Account created', type: 'datetime'}),
        defineField({name: 'passwordUpdatedAt', title: 'Password last changed', type: 'datetime'}),
        defineField({name: 'lastLoginAt', title: 'Last signed in', type: 'datetime'}),
      ],
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
          {title: 'Storefront', value: 'storefront'},
          {title: 'Added by staff', value: 'manual'},
        ],
      },
      initialValue: 'manual',
    }),
  ],
  preview: {
    select: {title: 'name', phone: 'phone', email: 'email', hasAccount: 'auth.accountCreatedAt'},
    prepare({title, phone, email, hasAccount}) {
      return {
        title,
        subtitle: [phone, email, hasAccount ? 'Has account' : null].filter(Boolean).join(' · '),
      }
    },
  },
})
