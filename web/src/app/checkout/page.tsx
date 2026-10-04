import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound, redirect} from 'next/navigation'

import {services as registry, useCases} from '@/composition/container'
import {ProductNotFoundError} from '@/core/domain/errors'
import {placeOrderAction} from '@/presentation/actions/place-order'
import {CheckoutForm} from '@/presentation/components/checkout-form'
import {toCheckoutViewModel} from '@/presentation/view-models/checkout'

export const metadata: Metadata = {title: 'Checkout', robots: {index: false}}

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

/**
 * Single-item checkout: the product page hands over a slug, a variant and a
 * quantity. Prices shown here are indicative; the use case re-prices on submit.
 */
export default async function CheckoutPage({searchParams}: PageProps<'/checkout'>) {
  const params = await searchParams
  const slug = first(params.product)
  const variantId = first(params.variant)
  const quantity = Math.min(20, Math.max(1, Number.parseInt(first(params.qty) ?? '1', 10) || 1))

  if (!slug) redirect('/')

  let product
  try {
    product = await useCases.getProductDetail(slug)
  } catch (error) {
    if (error instanceof ProductNotFoundError) notFound()
    throw error
  }

  const variant = variantId ? (product.variants.find((candidate) => candidate.id === variantId) ?? null) : null
  if (product.variants.length > 0 && !variant) {
    redirect(`/products/${product.slug}`)
  }

  const settings = await useCases.getSiteSettings()
  const view = toCheckoutViewModel(product, variant, quantity, settings, {
    images: registry.imageUrls,
    locale: registry.storefront.locale,
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm">
        <ol className="flex items-center gap-2 text-ink-muted">
          <li>
            <Link href="/" className="hover:text-ink">
              Shop
            </Link>
          </li>
          <li aria-hidden="true" className="text-ink-faint">
            /
          </li>
          <li>
            <Link href={`/products/${product.slug}`} className="hover:text-ink">
              {product.name}
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
          <CheckoutForm view={view} action={placeOrderAction} />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-ink-faint">Your order</h2>
            <div className="flex gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-control bg-surface-sunken">
                {view.item.image && (
                  <Image src={view.item.image.src} alt={view.item.image.alt} fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="font-medium text-ink">{view.item.productName}</p>
                {view.item.variantLabel && <p className="text-sm text-ink-muted">{view.item.variantLabel}</p>}
                <p className="text-sm text-ink-muted">
                  {view.item.quantity} × {view.item.unitPriceLabel}
                </p>
              </div>
              <p className="font-medium tabular-nums text-ink">{view.item.lineTotalLabel}</p>
            </div>
            <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums text-ink">{view.subtotalLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Delivery</dt>
                <dd className="text-ink-muted">Chosen below</dd>
              </div>
              {view.shipping.freeFromLabel && (
                <p className="rounded-control bg-success-soft px-3 py-2 text-xs text-success">
                  Free delivery inside Dhaka on orders over {view.shipping.freeFromLabel}.
                </p>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
