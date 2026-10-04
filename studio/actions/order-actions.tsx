import {useState} from 'react'
import {useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {PackageIcon} from '@sanity/icons/Package'

interface OrderDoc {
  _id: string
  orderNumber?: string
  status?: string
  total?: number
  payment?: {status?: string; method?: string}
}

function currentOrder(props: Parameters<DocumentActionComponent>[0]): OrderDoc | null {
  return (props.draft ?? props.published) as OrderDoc | null
}

/**
 * "Cash collected": the courier has handed over the money. Marks the payment
 * paid with the amount and time, and moves a shipped order to delivered,
 * because cash on delivery means both happen together.
 */
export const CashCollectedAction: DocumentActionComponent = (props) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const [confirming, setConfirming] = useState(false)
  const order = currentOrder(props)

  if (!order || order.payment?.status === 'paid') return null
  if (order.status === 'cancelled' || order.status === 'returned') return null

  const amount = typeof order.total === 'number' ? `৳${order.total.toLocaleString()}` : 'the total'

  return {
    label: 'Cash collected',
    icon: CheckmarkCircleIcon,
    tone: 'positive',
    shortcut: 'mod+shift+p',
    onHandle: () => setConfirming(true),
    dialog: confirming && {
      type: 'confirm',
      tone: 'positive',
      message: `Record ${amount} as collected in cash for ${order.orderNumber ?? 'this order'}? ${
        order.status !== 'delivered' ? 'The order will also be marked delivered.' : ''
      }`,
      onCancel: () => setConfirming(false),
      onConfirm: () => {
        const now = new Date().toISOString()
        patch.execute([
          {
            set: {
              'payment.status': 'paid',
              'payment.paidAt': now,
              'payment.amountPaid': order.total ?? 0,
              ...(order.status !== 'delivered' ? {status: 'delivered'} : {}),
            },
          },
        ])
        publish.execute()
        setConfirming(false)
        props.onComplete()
      },
    },
  }
}

const NEXT_STEP: Record<string, {status: string; label: string}> = {
  pending: {status: 'confirmed', label: 'Confirm order'},
  confirmed: {status: 'processing', label: 'Start preparing'},
  processing: {status: 'shipped', label: 'Hand to courier'},
  shipped: {status: 'delivered', label: 'Mark delivered'},
}

/**
 * One button that always offers the next step in the fulfilment flow, so
 * staff never have to remember the sequence or open the Summary tab.
 */
export const AdvanceOrderAction: DocumentActionComponent = (props) => {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const order = currentOrder(props)
  const next = order?.status ? NEXT_STEP[order.status] : undefined

  if (!order || !next) return null

  return {
    label: next.label,
    icon: PackageIcon,
    tone: 'primary',
    onHandle: () => {
      patch.execute([{set: {status: next.status}}])
      publish.execute()
      props.onComplete()
    },
  }
}
