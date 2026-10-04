import type {Metadata} from 'next'
import Link from 'next/link'
import {redirect} from 'next/navigation'

import {services, useCases} from '@/composition/container'
import {logoutAction} from '@/presentation/actions/auth'
import {Badge} from '@/presentation/components/badge'
import {toOrderConfirmationViewModel} from '@/presentation/view-models/checkout'

export const metadata: Metadata = {title: 'Your account', robots: {index: false}}

export default async function AccountPage() {
  if (!services.accountsEnabled) redirect('/')
  const account = await useCases.getCurrentCustomer()
  if (!account) redirect('/account/login?next=/account')

  const orders = (await useCases.listMyOrders()).map((order) =>
    toOrderConfirmationViewModel(order, services.storefront.locale),
  )

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pb-20 pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Your account</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Hi, {account.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {account.phone}
            {account.email ? ` · ${account.email}` : ''}
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="inline-flex h-10 items-center rounded-control border border-line px-4 text-sm font-medium text-ink hover:border-line-strong">
            Sign out
          </button>
        </form>
      </div>

      <section className="mt-10" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-lg font-semibold tracking-tight text-ink">
          Orders
        </h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-card border border-dashed border-line-strong p-8 text-center">
            <p className="text-ink-muted">No orders yet.</p>
            <Link href="/" className="mt-4 inline-flex h-10 items-center rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-strong">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.orderNumber}>
                <Link
                  href={`/checkout/thanks/${encodeURIComponent(order.orderNumber)}`}
                  className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 transition-colors hover:border-line-strong sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-sm font-semibold text-ink">{order.orderNumber}</p>
                    <p className="text-sm text-ink-muted">
                      {order.placedAtLabel} · {order.lines.reduce((sum, line) => sum + line.quantity, 0)} items
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {order.lines.map((line) => line.title).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <Badge tone={order.statusLabel === 'Delivered' ? 'success' : 'neutral'}>{order.statusLabel}</Badge>
                    <p className="font-semibold tabular-nums text-ink">{order.totalLabel}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
