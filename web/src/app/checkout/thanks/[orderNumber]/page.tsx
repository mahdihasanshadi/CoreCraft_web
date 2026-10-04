import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'

import {services as registry, useCases} from '@/composition/container'
import {OrderNotFoundError, WriteAccessUnavailableError} from '@/core/domain/errors'
import {Badge} from '@/presentation/components/badge'
import {toOrderConfirmationViewModel} from '@/presentation/view-models/checkout'

export const metadata: Metadata = {title: 'Order confirmed', robots: {index: false}}

export default async function OrderConfirmationPage({params}: PageProps<'/checkout/thanks/[orderNumber]'>) {
  const {orderNumber} = await params

  let order
  try {
    order = await useCases.getOrderByNumber(decodeURIComponent(orderNumber))
  } catch (error) {
    if (error instanceof OrderNotFoundError || error instanceof WriteAccessUnavailableError) notFound()
    throw error
  }

  const [view, settings] = [
    toOrderConfirmationViewModel(order, registry.storefront.locale),
    await useCases.getSiteSettings(),
  ]
  const whatsappHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : null
  const payTo =
    order.payment.method === 'bkash'
      ? settings.paymentInstructions.bkashNumber
      : order.payment.method === 'nagad'
        ? settings.paymentInstructions.nagadNumber
        : order.payment.method === 'bankTransfer'
          ? settings.paymentInstructions.bankDetails
          : null

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12 sm:pt-16">
      <header className="mb-10 text-center">
        <div aria-hidden="true" className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-success-soft text-success">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Order placed</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Thanks, {view.customerName.split(' ')[0]}.
        </h1>
        <p className="mt-3 text-ink-muted">
          Your order number is <span className="font-mono font-semibold text-ink">{view.orderNumber}</span>. We
          will call to confirm before it ships.
        </p>
      </header>

      {payTo && (
        <section className="mb-8 rounded-card border border-accent/30 bg-accent-soft/50 p-5">
          <h2 className="text-sm font-semibold text-ink">
            {order.payment.method === 'bankTransfer' ? 'Pay by bank transfer' : `Send ${view.totalLabel} with ${view.paymentMethodLabel}`}
          </h2>
          <p className="mt-2 whitespace-pre-line font-mono text-sm text-ink">{payTo}</p>
          <p className="mt-2 text-xs text-ink-muted">
            Use {view.orderNumber} as the reference, then share the transaction ID with us
            {whatsappHref ? ' on WhatsApp' : ''}.
          </p>
        </section>
      )}

      <section className="rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">Summary</h2>
          <Badge tone="neutral">{view.statusLabel}</Badge>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {view.lines.map((line) => (
            <li key={line.key} className="flex items-baseline justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-ink">
                  {line.quantity} × {line.title}
                </p>
                {line.detail && <p className="text-sm text-ink-muted">{line.detail}</p>}
              </div>
              <p className="tabular-nums text-ink">{line.lineTotalLabel}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular-nums text-ink">{view.subtotalLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Delivery</dt>
            <dd className="tabular-nums text-ink">{view.shippingLabel}</dd>
          </div>
          {view.discountLabel && (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Discount</dt>
              <dd className="tabular-nums text-ink">− {view.discountLabel}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt className="text-ink">Total</dt>
            <dd className="tabular-nums text-ink">{view.totalLabel}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-5 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Delivering to</h2>
          <address className="not-italic leading-relaxed text-ink">
            {view.address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </section>
        <section className="rounded-card border border-line bg-surface p-5 text-sm">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink-faint">Payment</h2>
          <p className="text-ink">{view.paymentMethodLabel}</p>
          <p className="text-ink-muted">{view.paymentStatusLabel}</p>
          <p className="mt-2 text-xs text-ink-faint">Placed {view.placedAtLabel}</p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-strong">
          Keep shopping
        </Link>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-control border border-line px-5 text-sm font-medium text-ink hover:border-line-strong">
            Message us on WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
