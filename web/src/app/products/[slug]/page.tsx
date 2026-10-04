import type {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'

import {services, useCases} from '@/composition/container'
import {ProductNotFoundError} from '@/core/domain/errors'
import {addToBagAction, buyNowAction} from '@/presentation/actions/cart'
import {recordInterestAction} from '@/presentation/actions/record-interest'
import {Badge} from '@/presentation/components/badge'
import {Price} from '@/presentation/components/price'
import {ProductGallery} from '@/presentation/components/product-gallery'
import {ProductRail} from '@/presentation/components/product-rail'
import {PurchasePanel} from '@/presentation/components/purchase-panel'
import {RichTextRenderer} from '@/presentation/components/rich-text'
import {TrustCard} from '@/presentation/components/trust-card'
import {formatMoney} from '@/presentation/formatting/money'
import {shopHref} from '@/presentation/navigation'
import {productTypeLabels, toProductCardViewModel} from '@/presentation/view-models/product-card'
import {toProductDetailViewModel} from '@/presentation/view-models/product-detail'

const OG_IMAGE = {width: 1200, height: 630} as const

export async function generateStaticParams() {
  const slugs = await useCases.listProductSlugs()
  return slugs.map((slug) => ({slug}))
}

export async function generateMetadata({params}: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const {slug} = await params
  const result = await useCases.getProductSeo(slug)
  if (!result) return {}

  const title = result.seo.title ?? result.name
  const description = result.seo.description ?? undefined
  const shareImage = result.seo.shareImage
    ? [{url: services.imageUrls.resolve(result.seo.shareImage, OG_IMAGE), ...OG_IMAGE}]
    : undefined

  return {
    title,
    description,
    openGraph: {title, description, images: shareImage, type: 'website'},
    twitter: {card: shareImage ? 'summary_large_image' : 'summary', title, description},
  }
}

export default async function ProductPage({params}: PageProps<'/products/[slug]'>) {
  const {slug} = await params

  let product
  try {
    product = await useCases.getProductDetail(slug)
  } catch (error) {
    if (error instanceof ProductNotFoundError) notFound()
    throw error
  }

  const [settings, related] = await Promise.all([useCases.getSiteSettings(), useCases.listRelatedProducts(product)])
  const context = {images: services.imageUrls, locale: services.storefront.locale}
  const view = toProductDetailViewModel(product, {...context, customisationFee: settings.jerseyCustomisationFee})
  const relatedCards = related.map((item) => toProductCardViewModel(item, context))

  const trust = [
    'Cash on delivery, nothing charged now',
    settings.shipping.freeFrom
      ? `Free delivery inside Dhaka over ${formatMoney(settings.shipping.freeFrom, context.locale)}`
      : `Delivery from ${formatMoney(settings.shipping.insideDhaka, context.locale)} inside Dhaka`,
    ...settings.usps.filter((line) => /exchange|return/i.test(line)),
    'We call to confirm before dispatch',
  ].slice(0, 4)

  return (
    <>
      <article className="mx-auto w-full max-w-6xl px-6 pb-16 pt-6 sm:pt-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2 text-ink-muted">
            <li>
              <Link href="/shop" className="hover:text-ink">
                Shop
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-faint">
              /
            </li>
            <li>
              <Link href={shopHref(product.productType)} className="hover:text-ink">
                {productTypeLabels[product.productType]}
              </Link>
            </li>
            <li aria-hidden="true" className="text-ink-faint">
              /
            </li>
            <li aria-current="page" className="truncate text-ink">
              {view.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ProductGallery images={view.images} productName={view.name} />

          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {view.brandName && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{view.brandName}</p>
                )}
                {view.jerseyBadge && <Badge tone="accent">{view.jerseyBadge}</Badge>}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink text-balance sm:text-4xl">{view.name}</h1>
              <Price
                size="lg"
                priceLabel={view.priceLabel}
                compareAtLabel={view.compareAtLabel}
                discountLabel={view.discountLabel}
                isFrom={view.priceIsFrom}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={view.inStock ? 'success' : 'neutral'}>{view.stockLabel}</Badge>
                {view.customisable && <Badge tone="neutral">Name and number printing available</Badge>}
              </div>
            </header>

            {view.excerpt && <p className="text-base leading-relaxed text-ink-muted text-pretty">{view.excerpt}</p>}

            <div className="rounded-card border border-line bg-surface p-5 shadow-card">
              <PurchasePanel
                productSlug={product.slug}
                variants={view.variants}
                productInStock={view.inStock}
                customisable={view.customisable}
                customisationFeeLabel={view.customisationFeeLabel}
                notifyAction={recordInterestAction}
                addToBagAction={addToBagAction}
                buyNowAction={buyNowAction}
              />
            </div>

            <TrustCard items={trust} />

            {view.specs.length > 0 && (
              <section aria-labelledby="specs-heading">
                <h2 id="specs-heading" className="sr-only">
                  Details
                </h2>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-card bg-surface-muted/60 p-5 text-sm sm:grid-cols-3">
                  {view.specs.map((spec) => (
                    <div key={spec.label} className="flex flex-col gap-0.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{spec.label}</dt>
                      <dd className="text-ink">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {view.description.length > 0 && (
              <section aria-labelledby="description-heading" className="border-t border-line pt-6">
                <h2 id="description-heading" className="mb-3 text-sm font-semibold text-ink">
                  About this piece
                </h2>
                <RichTextRenderer value={view.description} images={services.imageUrls} />
              </section>
            )}

            {view.careInstructions.length > 0 && (
              <section aria-labelledby="care-heading" className="border-t border-line pt-6">
                <h2 id="care-heading" className="mb-3 text-sm font-semibold text-ink">
                  Care
                </h2>
                <ul className="flex flex-col gap-1.5 text-sm text-ink-muted">
                  {view.careInstructions.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {view.sizeChart && (
              <details className="group border-t border-line pt-6">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:content-none">
                  Size chart
                  <span className="ml-2 inline-block text-ink-faint transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="mt-4 overflow-hidden rounded-card border border-line">
                  <Image src={view.sizeChart.src} alt={view.sizeChart.alt} width={1200} height={800} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" />
                </div>
              </details>
            )}

            {view.categories.length > 0 && (
              <section aria-label="Categories" className="border-t border-line pt-6">
                <ul className="flex flex-wrap gap-2">
                  {view.categories.map((category) => (
                    <li key={category.id}>
                      <Badge tone="neutral">{category.title}</Badge>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>

      <div className="pb-20">
        <ProductRail id="related-heading" eyebrow="Goes with it" title="You may also like" href={shopHref(product.productType)} products={relatedCards} />
      </div>
    </>
  )
}
