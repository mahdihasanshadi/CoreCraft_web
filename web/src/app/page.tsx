import {services, useCases} from '@/composition/container'
import {EmptyState} from '@/presentation/components/empty-state'
import {ProductGrid} from '@/presentation/components/product-grid'
import {toProductCardViewModel} from '@/presentation/view-models/product-card'

/**
 * A route is a thin controller: call a use case, shape the result for the
 * view, hand it to components. No fetching, formatting, or rules live here.
 */
export default async function HomePage() {
  const products = await useCases.listStorefrontProducts()
  const context = {images: services.imageUrls, locale: services.storefront.locale}
  const cards = products.map((product) => toProductCardViewModel(product, context))

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <section className="mb-10 max-w-2xl sm:mb-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          The collection
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink text-balance sm:text-5xl">
          Made to be used, built to be kept.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
          Every product here is published from the Studio. Edit it there and the page updates
          without a deploy.
        </p>
      </section>

      {cards.length === 0 ? (
        <EmptyState
          title="Nothing on the shelves yet"
          description="Add a product in the Studio, set its status to Active, and publish. It appears here the moment you do."
          action={{label: 'Open the Studio', href: services.storefront.studioUrl}}
        />
      ) : (
        <>
          <p className="mb-5 text-sm text-ink-muted" aria-live="polite">
            {cards.length === 1 ? '1 product' : `${cards.length} products`}
          </p>
          <ProductGrid products={cards} />
        </>
      )}
    </div>
  )
}
