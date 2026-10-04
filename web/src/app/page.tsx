import {services, useCases} from '@/composition/container'
import {EmptyState} from '@/presentation/components/empty-state'
import {ProductGrid} from '@/presentation/components/product-grid'
import {toProductCardViewModel} from '@/presentation/view-models/product-card'

/**
 * A route is a thin controller: call use cases, shape the result for the
 * view, hand it to components. No fetching, formatting, or rules live here.
 */
export default async function HomePage() {
  const [products, settings] = await Promise.all([
    useCases.listStorefrontProducts(),
    useCases.getSiteSettings(),
  ])
  const context = {images: services.imageUrls, locale: services.storefront.locale}
  const cards = products.map((product) => toProductCardViewModel(product, context))
  const featured = cards.filter((card) => card.featured)
  const rest = featured.length > 0 ? cards.filter((card) => !card.featured) : cards

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <section className="mb-12 max-w-2xl sm:mb-16">
        {settings.tagline && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {settings.tagline}
          </p>
        )}
        <h1 className="text-4xl font-semibold tracking-tight text-ink text-balance sm:text-5xl">
          {settings.heroHeading ?? settings.storeName}
        </h1>
        {settings.heroText && (
          <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">{settings.heroText}</p>
        )}
      </section>

      {cards.length === 0 ? (
        <EmptyState
          title="Nothing on the shelves yet"
          description="Add a product in the Studio, set its status to Active, and publish. It appears here the moment you do."
          action={{label: 'Open the Studio', href: services.storefront.studioUrl}}
        />
      ) : (
        <div className="flex flex-col gap-14">
          {featured.length > 0 && (
            <section aria-labelledby="featured-heading">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 id="featured-heading" className="text-xl font-semibold tracking-tight text-ink">
                  Featured
                </h2>
              </div>
              <ProductGrid products={featured} />
            </section>
          )}

          {rest.length > 0 && (
            <section aria-labelledby="all-heading">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 id="all-heading" className="text-xl font-semibold tracking-tight text-ink">
                  {featured.length > 0 ? 'Everything else' : 'All products'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {cards.length === 1 ? '1 product' : `${cards.length} products`}
                </p>
              </div>
              <ProductGrid products={rest} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
