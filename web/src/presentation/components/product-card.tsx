import Image from 'next/image'
import Link from 'next/link'

import {wishlistAction} from '../actions/wishlist'
import type {ProductCardViewModel} from '../view-models/product-card'
import {WishlistButton} from './wishlist-button'

/**
 * Pure presentational apart from the heart. Receives a finished view model,
 * so it has no idea where the data came from and can be rendered from a
 * fixture. The whole image and text block is one link; the heart and quick
 * add sit beside it, never inside it.
 */
export function ProductCard({product}: {product: ProductCardViewModel}) {
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface-sunken">
        <Link href={product.href} className="absolute inset-0" aria-label={product.name}>
          {product.image ? (
            <>
              <Image
                src={product.image.src}
                alt={product.image.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className={`object-cover transition-opacity duration-500 ${
                  product.hoverImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.03]'
                } ${product.inStock ? '' : 'opacity-60 saturate-50'} transition-transform duration-700 ease-out-soft`}
              />
              {product.hoverImage && (
                <Image
                  src={product.hoverImage.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-faint">Photo coming soon</div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.discountLabel && (
            <span className="rounded-md bg-sale px-2 py-1 text-[11px] font-bold text-white">{product.discountLabel}</span>
          )}
          {!product.inStock && (
            <span className="rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-canvas">Sold out</span>
          )}
        </div>

        <WishlistButton productSlug={product.slug} action={wishlistAction} className="absolute right-2.5 top-2.5" />

        {product.availableSizes.length > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex translate-y-2 flex-wrap gap-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            {product.availableSizes.map((size) => (
              <span key={size} className="rounded-md bg-surface/95 px-2 py-1 text-[11px] font-semibold text-ink shadow-card">
                {size}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{product.typeLabel}</p>
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-ink">
          <Link href={product.href} className="after:absolute after:inset-0 after:content-[''] after:pointer-events-none">
            {product.name}
          </Link>
        </h3>
        {product.swatches.length > 0 && (
          <ul className="flex items-center gap-1" aria-label="Available colours">
            {product.swatches.map((swatch) => (
              <li
                key={swatch.hex}
                title={swatch.name}
                className="h-3 w-3 rounded-full border border-black/10 ring-1 ring-surface"
                style={{backgroundColor: swatch.hex}}
              >
                <span className="sr-only">{swatch.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="flex flex-col gap-1">
            {product.savingsLabel && (
              <span className="w-fit rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-semibold text-success">
                {product.savingsLabel}
              </span>
            )}
            <p className="flex items-baseline gap-2">
              <span className="text-base font-bold tabular-nums text-ink">{product.priceLabel}</span>
              {product.compareAtLabel && (
                <s className="text-xs tabular-nums text-ink-faint">{product.compareAtLabel}</s>
              )}
            </p>
          </div>
          <Link
            href={product.href}
            aria-label={`View ${product.name}`}
            className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-canvas transition-colors hover:bg-accent-strong hover:text-on-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}
