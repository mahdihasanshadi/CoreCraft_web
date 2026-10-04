import {documentEventHandler} from '@sanity/functions'

/**
 * Posts a Telegram message to the shop team the moment a new order lands in
 * the commerce dataset. Fires on `create` only (see sanity.blueprint.ts), so
 * status changes made later in the Studio never re-notify.
 *
 * Needs two environment variables on the function:
 *   TELEGRAM_BOT_TOKEN  from @BotFather
 *   TELEGRAM_CHAT_ID    the group or channel the bot posts into
 */

export interface OrderEvent {
  _id: string
  orderNumber?: string
  total?: number
  currency?: string
  customer?: {name?: string; phone?: string} | null
  shippingAddress?: {city?: string; area?: string} | null
  items?: Array<{name?: string; variant?: string; quantity?: number}> | null
  payment?: {method?: string} | null
}

const money = (amount: number | undefined, currency = 'BDT') =>
  new Intl.NumberFormat('en-BD', {style: 'currency', currency, maximumFractionDigits: 0}).format(amount ?? 0)

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function formatOrderMessage(order: OrderEvent, studioUrl: string): string {
  const lines = (order.items ?? []).map((item) => {
    const variant = item.variant ? ` (${item.variant})` : ''
    return `• ${item.quantity ?? 1} × ${escapeHtml(`${item.name ?? 'Item'}${variant}`)}`
  })
  const where = [order.shippingAddress?.area, order.shippingAddress?.city].filter(Boolean).join(', ')
  const customer = [order.customer?.name, order.customer?.phone].filter(Boolean).join(' · ')
  const payment = order.payment?.method === 'cod' ? 'Cash on delivery' : (order.payment?.method ?? 'Payment method unknown')

  return [
    `🧵 <b>New order ${escapeHtml(order.orderNumber ?? order._id)}</b>`,
    customer && `👤 ${escapeHtml(customer)}`,
    where && `📍 ${escapeHtml(where)}`,
    ...lines,
    `💵 <b>${money(order.total, order.currency)}</b> · ${escapeHtml(payment)}`,
    `<a href="${studioUrl}/commerce/structure/orders;${encodeURIComponent(order._id)}">Open in Studio</a>`,
  ]
    .filter(Boolean)
    .join('\n')
}

export const handler = documentEventHandler<OrderEvent>(async ({event}) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('order-notify: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set, skipping')
    return
  }

  const studioUrl = process.env.STUDIO_URL ?? 'https://corecraft.sanity.studio'
  const text = formatOrderMessage(event.data, studioUrl)

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true}),
  })

  if (!response.ok) {
    // Surface the Telegram error in the function logs rather than failing silently.
    throw new Error(`Telegram responded ${response.status}: ${await response.text()}`)
  }
  console.log(`order-notify: sent ${event.data.orderNumber ?? event.data._id}`)
})
