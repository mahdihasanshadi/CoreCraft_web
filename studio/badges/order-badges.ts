import type {DocumentBadgeComponent, DocumentBadgeDescription} from 'sanity'

import {orderStatuses} from '../schemaTypes/documents/order'
import {paymentStatuses} from '../schemaTypes/objects/payment-details'

type BadgeColor = NonNullable<DocumentBadgeDescription['color']>

interface OrderLike {
  status?: string
  payment?: {status?: string; method?: string}
}

const paymentColors: Record<string, BadgeColor> = {
  paid: 'success',
  pending: 'warning',
  unpaid: 'primary',
  failed: 'danger',
  refunded: 'danger',
}

const fulfilmentColors: Record<string, BadgeColor> = {
  pending: 'warning',
  confirmed: 'primary',
  processing: 'primary',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'danger',
}

function current(props: Parameters<DocumentBadgeComponent>[0]): OrderLike | null {
  return (props.draft ?? props.published) as OrderLike | null
}

/**
 * Shows payment state in the document header so staff never have to open the
 * Payment tab to know whether money has arrived.
 */
export const PaymentStatusBadge: DocumentBadgeComponent = (props) => {
  const payment = current(props)?.payment
  if (!payment?.status) return null
  const label = paymentStatuses.find((entry) => entry.value === payment.status)?.title ?? payment.status
  return {
    label,
    title: `Payment: ${label}`,
    color: paymentColors[payment.status] ?? 'primary',
  }
}

/** Fulfilment stage, next to the payment badge. */
export const FulfilmentStatusBadge: DocumentBadgeComponent = (props) => {
  const status = current(props)?.status
  if (!status) return null
  const label = orderStatuses.find((entry) => entry.value === status)?.title ?? status
  return {
    label,
    title: `Order: ${label}`,
    color: fulfilmentColors[status] ?? 'primary',
  }
}
