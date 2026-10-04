import {defineField, defineType} from 'sanity'
import {ClipboardIcon} from '@sanity/icons/Clipboard'

export const serviceRequestStatuses = [
  {title: 'New', value: 'new'},
  {title: 'Contacted', value: 'contacted'},
  {title: 'Quoted', value: 'quoted'},
  {title: 'Won', value: 'won'},
  {title: 'Lost', value: 'lost'},
] as const

/** A form submission asking about a service. Lives in the private dataset. */
export const serviceRequest = defineType({
  name: 'serviceRequest',
  title: 'Service request',
  type: 'document',
  icon: ClipboardIcon,
  groups: [
    {name: 'request', title: 'Request', default: true},
    {name: 'followUp', title: 'Follow-up'},
  ],
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'followUp',
      options: {list: [...serviceRequestStatuses], layout: 'radio'},
      initialValue: 'new',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      group: 'request',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'serviceId',
      title: 'Service ID',
      type: 'string',
      group: 'request',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'serviceTitle',
      title: 'Service',
      type: 'string',
      group: 'request',
      description: 'Snapshot of the service name at submission time.',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'request',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'request',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'request',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'organisation',
      title: 'Team or organisation',
      type: 'string',
      group: 'request',
    }),
    defineField({
      name: 'quantity',
      title: 'Approximate quantity',
      type: 'number',
      group: 'request',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 5,
      group: 'request',
    }),
    defineField({
      name: 'preferredContact',
      title: 'Preferred contact',
      type: 'string',
      group: 'request',
      options: {
        list: [
          {title: 'Phone call', value: 'phone'},
          {title: 'WhatsApp', value: 'whatsapp'},
          {title: 'Email', value: 'email'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'customer',
      title: 'Linked customer',
      type: 'reference',
      group: 'followUp',
      to: [{type: 'customer'}],
      description: 'Link once this person becomes a customer.',
    }),
    defineField({
      name: 'quotedAmount',
      title: 'Quoted amount',
      type: 'number',
      group: 'followUp',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'internalNotes',
      title: 'Internal notes',
      type: 'text',
      rows: 4,
      group: 'followUp',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'followUp',
      readOnly: true,
      options: {
        list: [
          {title: 'Website form', value: 'storefront'},
          {title: 'Entered by staff', value: 'manual'},
        ],
      },
      initialValue: 'manual',
    }),
  ],
  orderings: [
    {title: 'Newest first', name: 'submittedAtDesc', by: [{field: 'submittedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {name: 'name', serviceTitle: 'serviceTitle', status: 'status', organisation: 'organisation'},
    prepare({name, serviceTitle, status, organisation}) {
      const statusLabel =
        serviceRequestStatuses.find((entry) => entry.value === status)?.title ?? status
      return {
        title: [name, organisation].filter(Boolean).join(' · '),
        subtitle: [serviceTitle, statusLabel].filter(Boolean).join(' · '),
      }
    },
  },
})
