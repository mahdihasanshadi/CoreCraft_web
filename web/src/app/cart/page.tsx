import type {Metadata} from 'next'
import Link from 'next/link'

import {services, useCases} from '@/composition/container'
import {removeCartLineAction, updateCartLineAction} from '@/presentation/actions/cart'
import {CartLine} from '@/presentation/components/cart-line'
import {EmptyState} from '@/presentation/components/empty-state'
import {toCartViewModel} from '@/presentation/view-models/cart'

export const metadata: Metadata = {title: 'Your bag', robots: {index: false}}

export default async function CartPage() {
  const view = toCartViewModel(await useCases.viewCart(), {
    images: services.imageUrls,
    locale: services.storefront.locale,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:pt-14">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Your bag{' '}
        {view.count > 0 && (
          <span className="text-lg font-normal text-ink-muted">
            · {view.count} {view.count === 1 ? 'item' : 'items'}
          </span>
        )}
      </h1>

      {view.lines.length === 0 && view.unavailable.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your bag is empty"
            description="Everything you add shows up here, and stays here for a month."
            action={{label: 'Start shopping', href: '/'}}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {view.lines.map((line) => (
                <CartLine key={line.key} line={line} updateAction={updateCartLineAction} removeAction={removeCartLineAction} />
              ))}
            </ul>

            {view.unavailable.length > 0 && (
              <section className="mt-6 rounded-card border border-dashed border-line-strong p-5">
                <h2 className="text-sm font-semibold text-ink">No longer available</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {view.unavailable.map((entry) => (
                    <li key={entry.key} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-ink-muted">
                        <span className="capitalize text-ink">{entry.label}</span> · {entry.reason}
                      </span>
                      <form action={removeCartLineAction}>
                        <input type="hidden" name="key" value={entry.key} />
                        <button type="submit" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">Summary</h2>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="tabular-nums text-ink">{view.subtotalLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Delivery inside Dhaka</dt>
                  <dd className="tabular-nums text-ink">{view.deliveryInsideLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Delivery outside Dhaka</dt>
                  <dd className="tabular-nums text-ink">{view.deliveryOutsideLabel}</dd>
                </div>
              </dl>
              {view.freeDeliveryNudge && (
                <p className="rounded-control bg-success-soft px-3 py-2 text-xs text-success">{view.freeDeliveryNudge}</p>
              )}
              {view.canCheckout ? (
                <Link
                  href="/checkout"
                  className="inline-flex h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong"
                >
                  Checkout · cash on delivery
                </Link>
              ) : (
                <p className="text-sm text-ink-muted">Fix the items above to continue to checkout.</p>
              )}
              <Link href="/" className="text-center text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                Keep shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
