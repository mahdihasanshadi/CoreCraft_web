import type {Metadata} from 'next'
import Link from 'next/link'

import {services, useCases} from '@/composition/container'
import {isProductSort, isProductType, type ProductSort, type ProductType} from '@/core/domain/product'
import {EmptyState} from '@/presentation/components/empty-state'
import {ProductGrid} from '@/presentation/components/product-grid'
import {SearchBox} from '@/presentation/components/search-box'
import {SHOP_TYPES, shopHref} from '@/presentation/navigation'
import {productTypeLabels, toProductCardViewModel} from '@/presentation/view-models/product-card'

export const metadata: Metadata = {title: 'Shop', description: 'Every tee, drop-shoulder piece and jersey we make.'}

function first(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

const sortLabels: Record<ProductSort, string> = {
  featured: 'Featured',
  newest: 'Newest',
  priceAsc: 'Price: low to high',
  priceDesc: 'Price: high to low',
}

export default async function ShopPage({searchParams}: PageProps<'/shop'>) {
  const params = await searchParams
  const requestedType = first(params.type)
  const type: ProductType | null = isProductType(requestedType) ? requestedType : null
  const categorySlug = first(params.category)
  const requestedSort = first(params.sort)
  const sort: ProductSort = isProductSort(requestedSort) ? requestedSort : 'featured'

  const [products, allProducts, categories] = await Promise.all([
    useCases.listShop({productType: type, categorySlug, sort}),
    useCases.listStorefrontProducts(),
    useCases.listCategories(),
  ])
  const context = {images: services.imageUrls, locale: services.storefront.locale}
  const cards = products.map((product) => toProductCardViewModel(product, context))
  const activeCategory = categorySlug ? (categories.find((category) => category.slug === categorySlug) ?? null) : null

  const counts = new Map<ProductType, number>()
  for (const product of allProducts) counts.set(product.productType, (counts.get(product.productType) ?? 0) + 1)
  const typeChips = [
    {key: 'all', label: 'Everything', href: shopHref(null, {sort: sort === 'featured' ? null : sort}), count: allProducts.length, active: !type && !categorySlug},
    ...SHOP_TYPES.filter((candidate) => counts.has(candidate)).map((candidate) => ({
      key: candidate,
      label: productTypeLabels[candidate],
      href: shopHref(candidate, {sort: sort === 'featured' ? null : sort}),
      count: counts.get(candidate) ?? 0,
      active: type === candidate,
    })),
  ]

  const title = activeCategory?.title ?? (type ? productTypeLabels[type] : 'Shop everything')

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
      <div className="mb-6 flex flex-col gap-5">
        <SearchBox />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {cards.length === 1 ? '1 style' : `${cards.length} styles`}
              {activeCategory?.description ? ` · ${activeCategory.description}` : ''}
            </p>
          </div>
          <form method="get" action="/shop" className="flex items-center gap-2 text-sm">
            {type && <input type="hidden" name="type" value={type} />}
            {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
            <label htmlFor="sort" className="text-ink-muted">
              Sort
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-control border border-line bg-surface px-3 text-sm text-ink focus:border-ink focus:outline-none"
            >
              {(Object.keys(sortLabels) as ProductSort[]).map((option) => (
                <option key={option} value={option}>
                  {sortLabels[option]}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-secondary h-10 px-3">
              Apply
            </button>
          </form>
        </div>

        <nav aria-label="Filter by garment type">
          <ul className="scroll-rail -mx-6 gap-2 px-6 pb-1">
            {typeChips.map((chip) => (
              <li key={chip.key} className="shrink-0">
                <Link
                  href={chip.href}
                  aria-current={chip.active ? 'page' : undefined}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                    chip.active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink-muted hover:border-ink hover:text-ink'
                  }`}
                >
                  {chip.label}
                  <span className={`text-xs tabular-nums ${chip.active ? 'text-canvas/70' : 'text-ink-faint'}`}>{chip.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="Nothing here right now"
          description="Try another garment type, or browse everything."
          action={{label: 'Show everything', href: '/shop'}}
        />
      ) : (
        <ProductGrid products={cards} />
      )}
    </div>
  )
}
