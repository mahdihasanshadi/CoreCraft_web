import {services, useCases} from '@/composition/container'
import {isProductType, type ProductType} from '@/core/domain/product'
import {CollectionRail} from '@/presentation/components/collection-rail'
import {EmptyState} from '@/presentation/components/empty-state'
import {FilterChips, type FilterChip} from '@/presentation/components/filter-chips'
import {ProductGrid} from '@/presentation/components/product-grid'
import {productTypeLabels, toProductCardViewModel} from '@/presentation/view-models/product-card'

function first(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

/**
 * A route is a thin controller: call use cases, shape the result for the
 * view, hand it to components. No fetching, formatting, or rules live here.
 */
export default async function HomePage({searchParams}: PageProps<'/'>) {
  const [params, products, collections, settings] = await Promise.all([
    searchParams,
    useCases.listStorefrontProducts(),
    useCases.listCollections(),
    useCases.getSiteSettings(),
  ])

  const context = {images: services.imageUrls, locale: services.storefront.locale}
  const requestedType = first(params.type)
  const activeType: ProductType | null = isProductType(requestedType) ? requestedType : null

  const countsByType = new Map<ProductType, number>()
  for (const product of products) {
    countsByType.set(product.productType, (countsByType.get(product.productType) ?? 0) + 1)
  }

  const chips: FilterChip[] = [
    {key: 'all', label: 'Everything', href: '/', count: products.length, active: activeType === null},
    ...[...countsByType.entries()].map(([type, count]) => ({
      key: type,
      label: productTypeLabels[type],
      href: `/?type=${type}`,
      count,
      active: activeType === type,
    })),
  ]

  const visible = activeType ? products.filter((product) => product.productType === activeType) : products
  const cards = visible.map((product) => toProductCardViewModel(product, context))
  const featured = activeType ? [] : cards.filter((card) => card.featured)
  const rest = featured.length > 0 ? cards.filter((card) => !card.featured) : cards

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <section className="mb-10 max-w-2xl sm:mb-12">
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

      {products.length === 0 ? (
        <EmptyState
          title="Nothing on the shelves yet"
          description="Add a product in the Studio, set its status to Active, and publish. It appears here the moment you do."
          action={{label: 'Open the Studio', href: services.storefront.studioUrl}}
        />
      ) : (
        <div className="flex flex-col gap-14">
          {chips.length > 2 && <FilterChips chips={chips} label="Filter by garment type" />}

          {!activeType &&
            collections.map((collection) => (
              <CollectionRail
                key={collection.id}
                title={collection.title}
                description={collection.description}
                products={collection.products.map((product) => toProductCardViewModel(product, context))}
              />
            ))}

          {featured.length > 0 && (
            <section aria-labelledby="featured-heading" className="flex flex-col gap-5">
              <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight text-ink">
                Featured
              </h2>
              <ProductGrid products={featured} />
            </section>
          )}

          {rest.length > 0 && (
            <section aria-labelledby="all-heading" className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between">
                <h2 id="all-heading" className="text-2xl font-semibold tracking-tight text-ink">
                  {activeType ? productTypeLabels[activeType] : featured.length > 0 ? 'Everything else' : 'All products'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {visible.length === 1 ? '1 product' : `${visible.length} products`}
                </p>
              </div>
              <ProductGrid products={rest} />
            </section>
          )}

          {activeType && visible.length === 0 && (
            <EmptyState
              title={`No ${productTypeLabels[activeType].toLowerCase()} right now`}
              description="Check back soon, or browse everything else."
              action={{label: 'Show everything', href: '/'}}
            />
          )}
        </div>
      )}
    </div>
  )
}
