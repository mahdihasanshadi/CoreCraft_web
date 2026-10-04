import Image from 'next/image'
import Link from 'next/link'

import {services, useCases} from '@/composition/container'
import {CategoryTiles} from '@/presentation/components/category-tiles'
import {EmptyState} from '@/presentation/components/empty-state'
import {Hero} from '@/presentation/components/hero'
import {ProductGrid} from '@/presentation/components/product-grid'
import {ProductRail} from '@/presentation/components/product-rail'
import {SectionHeading} from '@/presentation/components/section-heading'
import {UspStrip} from '@/presentation/components/usp-strip'
import {toCategoryTileViewModel, toProductCardViewModel} from '@/presentation/view-models/product-card'

/**
 * The landing page. Every block is driven by content: hero and trust strip
 * from Site settings, tiles from categories, rails from recency and curation.
 * A route stays a thin controller: call use cases, shape, hand to components.
 */
export default async function HomePage() {
  const [settings, categories, newArrivals, products, collections] = await Promise.all([
    useCases.getSiteSettings(),
    useCases.listCategories(),
    useCases.listNewArrivals(),
    useCases.listStorefrontProducts(),
    useCases.listCollections(),
  ])
  const context = {images: services.imageUrls, locale: services.storefront.locale}

  const featured = products.filter((product) => product.featured).slice(0, 8).map((p) => toProductCardViewModel(p, context))
  const arrivals = newArrivals.map((product) => toProductCardViewModel(product, context))
  const tiles = categories.filter((category) => category.parentSlug === null).slice(0, 4).map((c) => toCategoryTileViewModel(c, context))
  const spotlight = collections[0] ?? null

  return (
    <div className="flex flex-col gap-16 pb-20 sm:gap-20">
      <div className="flex flex-col gap-0">
        <Hero
          eyebrow={settings.tagline}
          heading={settings.heroHeading ?? settings.storeName}
          text={settings.heroText}
          image={
            settings.heroImage
              ? {
                  src: services.imageUrls.resolve(settings.heroImage, {width: 2000, height: 1125}),
                  alt: settings.heroImage.alt ?? settings.storeName,
                }
              : null
          }
          cta={settings.heroCta ?? {label: 'Shop the collection', href: '/shop'}}
          secondaryCta={{label: 'Custom team kits', href: '/services'}}
        />
        <UspStrip items={settings.usps} />
      </div>

      {products.length === 0 ? (
        <div className="mx-auto w-full max-w-6xl px-6">
          <EmptyState
            title="Nothing on the shelves yet"
            description="Add a product in the Studio, set its status to Active, and publish. It appears here the moment you do."
            action={{label: 'Open the Studio', href: services.storefront.studioUrl}}
          />
        </div>
      ) : (
        <>
          {tiles.length > 0 && (
            <section aria-labelledby="shop-by-heading" className="mx-auto w-full max-w-6xl px-6">
              <SectionHeading id="shop-by-heading" eyebrow="Shop by" title="What are you after?" href="/shop" linkLabel="Everything" />
              <CategoryTiles tiles={tiles} />
            </section>
          )}

          <ProductRail
            id="new-arrivals-heading"
            eyebrow="Just landed"
            title="New arrivals"
            href="/shop?sort=newest"
            linkLabel="See all new"
            products={arrivals}
          />

          {spotlight && spotlight.products.length > 0 && (
            <section aria-labelledby="spotlight-heading" className="mx-auto w-full max-w-6xl px-6">
              <div className="grid overflow-hidden rounded-card bg-ink text-canvas lg:grid-cols-[1.1fr_1fr]">
                <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[420px]">
                  {(spotlight.heroImage ?? spotlight.products[0].primaryImage) && (
                    <Image
                      src={services.imageUrls.resolve((spotlight.heroImage ?? spotlight.products[0].primaryImage)!, {width: 1200, height: 900})}
                      alt={spotlight.heroImage?.alt ?? spotlight.title}
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Collection</p>
                  <h2 id="spotlight-heading" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {spotlight.title}
                  </h2>
                  {spotlight.description && <p className="max-w-md text-base leading-relaxed text-canvas/75">{spotlight.description}</p>}
                  <ul className="flex flex-wrap gap-2 text-sm text-canvas/80">
                    {spotlight.products.slice(0, 4).map((product) => (
                      <li key={product.id}>
                        <Link href={`/products/${product.slug}`} className="rounded-full border border-canvas/25 px-3 py-1.5 transition-colors hover:border-canvas hover:text-canvas">
                          {product.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href="/shop?type=footballJersey" className="inline-flex h-11 w-fit items-center rounded-control bg-canvas px-5 text-sm font-semibold text-ink transition-colors hover:bg-accent hover:text-on-accent">
                    Shop jerseys
                  </Link>
                </div>
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <section aria-labelledby="featured-heading" className="mx-auto w-full max-w-6xl px-6">
              <SectionHeading id="featured-heading" eyebrow="Best sellers" title="Worn on repeat" href="/shop" />
              <ProductGrid products={featured} />
            </section>
          )}

          <section aria-labelledby="kits-heading" className="mx-auto w-full max-w-6xl px-6">
            <div className="rounded-card border border-line bg-surface-muted/60 p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Made to order</p>
                <h2 id="kits-heading" className="mt-2 text-2xl font-semibold tracking-tight text-ink text-balance sm:text-3xl">
                  Full team kits in your colours, names and numbers included.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Football and cricket kits from eleven pieces, corporate tees from twenty-five. Same fabrics as the shop, your artwork.
                </p>
              </div>
              <Link href="/services" className="btn-primary mt-6 lg:mt-0">
                Request a quote
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
