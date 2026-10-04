'use client'

import {useId, useState} from 'react'

import type {VariantViewModel} from '../view-models/product-detail'

/**
 * Lets a shopper pick a variant and see its own price and availability.
 *
 * Sold-out variants stay selectable on purpose: hiding the price of a size
 * that is temporarily gone is more frustrating than showing it marked as out
 * of stock.
 */
export function VariantSelector({variants}: {variants: readonly VariantViewModel[]}) {
  const firstAvailable = variants.find((variant) => variant.inStock) ?? variants[0]
  const [selectedId, setSelectedId] = useState<string | undefined>(firstAvailable?.id)
  const labelId = useId()
  const selected = variants.find((variant) => variant.id === selectedId) ?? firstAvailable

  if (!selected) return null

  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 id={labelId} className="text-sm font-semibold text-ink">
          Choose a variant
        </h2>
        <p className="text-sm text-ink-muted" aria-live="polite">
          {selected.title}
          <span className="mx-1.5 text-ink-faint">·</span>
          <span className="font-medium text-ink tabular-nums">{selected.priceLabel}</span>
          <span className="mx-1.5 text-ink-faint">·</span>
          {selected.inStock ? (
            <span className="text-success">{selected.stock} in stock</span>
          ) : (
            <span>Out of stock</span>
          )}
        </p>
      </div>

      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const checked = variant.id === selected.id
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setSelectedId(variant.id)}
              title={variant.optionsLabel ?? undefined}
              className={`relative rounded-control border px-3.5 py-2 text-sm font-medium transition-colors ${
                checked
                  ? 'border-accent bg-accent-soft text-accent-strong'
                  : 'border-line bg-surface text-ink hover:border-line-strong'
              } ${variant.inStock ? '' : 'text-ink-faint'}`}
            >
              {variant.title}
              {!variant.inStock && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-1/2 h-px -rotate-6 bg-current opacity-60"
                />
              )}
              {!variant.inStock && <span className="sr-only"> (out of stock)</span>}
            </button>
          )
        })}
      </div>

      {selected.optionsLabel && (
        <p className="text-xs text-ink-faint">{selected.optionsLabel}</p>
      )}
    </section>
  )
}
