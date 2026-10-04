import type {Metadata} from 'next'
import Link from 'next/link'

import {services, useCases} from '@/composition/container'
import {EmptyState} from '@/presentation/components/empty-state'
import {ProductGrid} from '@/presentation/components/product-grid'
import {SearchBox} from '@/presentation/components/search-box'
import {SHOP_TYPES, shopHref} from '@/presentation/navigation'
import {productTypeLabels, toProductCardViewModel} from '@/presentation/view-models/product-card'

export const metadata: Metadata = {title: 'Search', robots: {index: false}}

export default async function SearchPage({searchParams}: PageProps<'/search'>) {
  const {q} = await searchParams
  const raw = Array.isArray(q) ? q[0] : q
  const {term, results} = await useCases.searchProducts(raw)
  const context = {images: services.imageUrls, locale: services.storefront.locale}
  const cards = results.map((product) => toProductCardViewModel(product, context))

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
      <div className="mx-auto mb-10 max-w-2xl">
        <h1 className="mb-4 text-center text-3xl font-semibold tracking-tight text-ink">Search</h1>
        <SearchBox defaultValue={raw ?? ''} autoFocus={!term} size="lg" />
        {!term && (
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {SHOP_TYPES.map((type) => (
              <li key={type}>
                <Link href={shopHref(type)} className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-sm font-medium text-ink-muted hover:border-ink hover:text-ink">
                  {productTypeLabels[type]}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {term && (
        <p className="mb-5 text-sm text-ink-muted" aria-live="polite">
          {cards.length === 0 ? 'No results' : cards.length === 1 ? '1 result' : `${cards.length} results`} for{' '}
          <span className="font-medium text-ink">“{term}”</span>
        </p>
      )}

      {term && cards.length === 0 ? (
        <EmptyState
          title="Nothing matched"
          description="Try a team, a garment type like “drop shoulder”, or a shorter word."
          action={{label: 'Browse the shop', href: '/shop'}}
        />
      ) : (
        cards.length > 0 && <ProductGrid products={cards} />
      )}
    </div>
  )
}
