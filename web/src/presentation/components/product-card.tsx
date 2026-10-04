import Image from 'next/image'
import Link from 'next/link'

import type {ProductCardViewModel} from '../view-models/product-card'
import {Badge} from './badge'
import {Price} from './price'

/**
 * Pure presentational. Receives a finished view model, so it has no idea where
 * the data came from and can be rendered from a fixture.
 */
export function ProductCard({product}: {product: ProductCardViewModel}) {
  return (
    <article className="group relative flex h-full flex-col">
      <Link
        href={product.href}
        className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-[transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-card-raised"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
          {product.image ? (
            <Image
              src={product.image.src}
              alt={product.image.alt}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className={`object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.04] ${
                product.inStock ? '' : 'opacity-60 saturate-50'
              }`}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-faint">
              Photo coming soon
            </div>
          )}

          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.discountLabel && <Badge tone="sale">{product.discountLabel}</Badge>}
            {!product.inStock && <Badge tone="neutral">Sold out</Badge>}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {product.typeLabel}
          </p>
          <h3 className="text-[15px] font-medium leading-snug text-ink text-pretty">
            {product.name}
          </h3>
          {product.excerpt && (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">{product.excerpt}</p>
          )}
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            <Price
              priceLabel={product.priceLabel}
              compareAtLabel={product.compareAtLabel}
              discountLabel={product.discountLabel}
            />
            {product.swatches.length > 0 && (
              <ul className="flex items-center gap-1" aria-label="Available colours">
                {product.swatches.map((swatch) => (
                  <li
                    key={swatch.hex}
                    title={swatch.name}
                    className="h-3.5 w-3.5 rounded-full border border-black/10 ring-1 ring-surface"
                    style={{backgroundColor: swatch.hex}}
                  >
                    <span className="sr-only">{swatch.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
