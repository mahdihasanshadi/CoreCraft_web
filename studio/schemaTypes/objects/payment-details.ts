import {defineField, defineType} from 'sanity'
import {CreditCardIcon} from '@sanity/icons/CreditCard'

export const paymentMethods = [
  {title: 'Cash on delivery', value: 'cod'},
  {title: 'bKash', value: 'bkash'},
  {title: 'Nagad', value: 'nagad'},
  {title: 'Card', value: 'card'},
  {title: 'Bank transfer', value: 'bankTransfer'},
] as const

export const paymentStatuses = [
  {title: 'Unpaid', value: 'unpaid'},
  {title: 'Pending confirmation', value: 'pending'},
  {title: 'Paid', value: 'paid'},
  {title: 'Failed', value: 'failed'},
  {title: 'Refunded', value: 'refunded'},
] as const

export const paymentDetails = defineType({
  name: 'paymentDetails',
  title: 'Payment',
  type: 'object',
  icon: CreditCardIcon,
  fields: [
    defineField({
      name: 'method',
      title: 'Method',
      type: 'string',
      options: {list: [...paymentMethods], layout: 'radio'},
      initialValue: 'cod',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: [...paymentStatuses], layout: 'radio'},
      initialValue: 'unpaid',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'reference',
      title: 'Transaction reference',
      type: 'string',
      description: 'bKash or Nagad transaction ID, bank reference, or gateway payment ID.',
    }),
    defineField({
      name: 'senderNumber',
      title: 'Sender wallet number',
      type: 'string',
      description: 'The mobile wallet number the shopper paid from, for bKash and Nagad.',
      hidden: ({parent}) => parent?.method !== 'bkash' && parent?.method !== 'nagad',
    }),
    defineField({
      name: 'amountPaid',
      title: 'Amount paid',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({name: 'paidAt', title: 'Paid at', type: 'datetime'}),
    defineField({
      name: 'gateway',
      title: 'Gateway',
      type: 'string',
      readOnly: true,
      description: 'Set by the storefront when a payment provider is involved.',
    }),
  ],
})
