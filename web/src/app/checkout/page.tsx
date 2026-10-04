import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {redirect} from 'next/navigation'

import {services, useCases} from '@/composition/container'
import {placeOrderAction} from '@/presentation/actions/place-order'
import {CheckoutForm} from '@/presentation/components/checkout-form'
import {toCartViewModel, toCheckoutViewModel} from '@/presentation/view-models/cart'

export const metadata: Metadata = {title: 'Checkout', robots: {index: false}}

/**
 * Checks out the whole bag. Prices shown are the same quote the cart page
 * used; the use case re-prices on submit and refuses anything that changed.
 */
export default async function CheckoutPage() {
  const [cartView, account] = await Promise.all([useCases.viewCart(), useCases.getCurrentCustomer()])
  const cart = toCartViewModel(cartView, {images: services.imageUrls, locale: services.storefront.locale})
  if (cart.lines.length === 0 && cart.unavailable.length === 0) redirect('/cart')

  const view = toCheckoutViewModel(cart, account)

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm">
        <ol className="flex items-center gap-2 text-ink-muted">
          <li>
            <Link href="/cart" className="hover:text-ink">
              Bag
            </Link>
          </li>
          <li aria-hidden="true" className="text-ink-faint">
            /
          </li>
          <li aria-current="page" className="text-ink">
            Checkout
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div>
          <h1 className="mb-8 text-3xl font-semibold tracking-tight text-ink">Checkout</h1>
          {view.problems.length > 0 ? (
            <div className="rounded-card border border-sale/30 bg-sale-soft p-5">
              <p className="font-medium text-sale">A few things in your bag need attention first.</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-sale">
                {view.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
              <Link href="/cart" className="mt-4 inline-flex h-10 items-center rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-strong">
                Back to your bag
              </Link>
            </div>
          ) : (
            <CheckoutForm view={view} action={placeOrderAction} />
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">Your order</h2>
            <ul className="flex flex-col divide-y divide-line">
              {view.lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-control bg-surface-sunken">
                    {line.image && <Image src={line.image.src} alt={line.image.alt} fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate font-medium text-ink">{line.name}</p>
                    {line.variantLabel && <p className="text-sm text-ink-muted">{line.variantLabel}</p>}
                    {line.printLabel && <p className="text-sm text-ink-muted">{line.printLabel}</p>}
                    <p className="text-sm text-ink-muted">Qty {line.quantity}</p>
                  </div>
                  <p className="font-medium tabular-nums text-ink">{line.lineTotalLabel}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums text-ink">{view.subtotalLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="text-ink-muted">By zone, chosen in the form</dd>
              </div>
            </dl>
            <Link href="/cart" className="mt-4 inline-block text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Edit bag
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
