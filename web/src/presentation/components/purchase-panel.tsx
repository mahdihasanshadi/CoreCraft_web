'use client'

import Link from 'next/link'
import {useActionState, useEffect, useId, useMemo, useState} from 'react'

import {idleState, type ActionState} from '../actions/action-state'
import type {VariantViewModel} from '../view-models/product-detail'
import {FormNotice, TextField} from './form-fields'
import {NotifyMeForm} from './notify-me-form'

type StatefulAction = (previous: ActionState, formData: FormData) => Promise<ActionState>
type PlainAction = (formData: FormData) => Promise<void>

export interface PurchasePanelProps {
  readonly productSlug: string
  readonly variants: readonly VariantViewModel[]
  readonly productInStock: boolean
  readonly customisable: boolean
  readonly customisationFeeLabel: string
  readonly notifyAction: StatefulAction
  readonly addToBagAction: StatefulAction
  readonly buyNowAction: PlainAction
}

/**
 * Colour first, then size, the way shoppers think about a garment. Then the
 * one action that fits the selection: add to bag, buy now, or ask to be told
 * when it is back. Sold-out sizes stay visible and selectable on purpose.
 */
export function PurchasePanel({
  productSlug,
  variants,
  productInStock,
  customisable,
  customisationFeeLabel,
  notifyAction,
  addToBagAction,
  buyNowAction,
}: PurchasePanelProps) {
  const labelId = useId()
  const fieldId = useId()
  const [bagState, bagAction, bagPending] = useActionState(addToBagAction, idleState)

  const colours = useMemo(() => {
    const seen = new Map<string, {name: string; hex: string | null; anyInStock: boolean}>()
    for (const variant of variants) {
      const key = variant.colour ?? ''
      const current = seen.get(key)
      seen.set(key, {
        name: variant.colour ?? 'Default',
        hex: variant.colourHex ?? current?.hex ?? null,
        anyInStock: (current?.anyInStock ?? false) || variant.inStock,
      })
    }
    return [...seen.entries()].map(([key, value]) => ({key, ...value}))
  }, [variants])

  const firstAvailable = variants.find((variant) => variant.inStock) ?? variants[0]
  const [colourKey, setColourKey] = useState<string>(firstAvailable?.colour ?? '')
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable?.id)
  const [quantity, setQuantity] = useState(1)
  const [wantsPrint, setWantsPrint] = useState(false)

  useEffect(() => {
    if (bagState.status === 'success') window.dispatchEvent(new CustomEvent('cart:changed'))
  }, [bagState])

  const sizesForColour = variants.filter((variant) => (variant.colour ?? '') === colourKey)
  const selected =
    sizesForColour.find((variant) => variant.id === variantId) ??
    sizesForColour.find((variant) => variant.inStock) ??
    sizesForColour[0]

  const hasVariants = variants.length > 0
  const hasColourChoice = colours.length > 1 || (colours.length === 1 && colours[0].key !== '')
  const canBuy = hasVariants ? Boolean(selected?.inStock) : productInStock
  const maxQuantity = Math.max(1, Math.min(10, selected?.stock ?? 10))

  function chooseColour(key: string) {
    setColourKey(key)
    const next =
      variants.find((variant) => (variant.colour ?? '') === key && variant.inStock) ??
      variants.find((variant) => (variant.colour ?? '') === key)
    setVariantId(next?.id)
    setQuantity(1)
  }

  return (
    <div className="flex flex-col gap-5">
      {hasVariants && hasColourChoice && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="text-sm font-semibold text-ink">
            Colour <span className="font-normal text-ink-muted">· {selected?.colour ?? 'Default'}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colours.map((colour) => {
              const checked = colour.key === colourKey
              return (
                <button
                  key={colour.key || 'default'}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  aria-label={colour.name}
                  title={colour.name}
                  onClick={() => chooseColour(colour.key)}
                  className={`relative h-9 w-9 rounded-full border-2 transition-[transform,border-color] ${
                    checked ? 'scale-105 border-accent' : 'border-line hover:border-line-strong'
                  } ${colour.anyInStock ? '' : 'opacity-50'}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-1 rounded-full border border-black/10"
                    style={{backgroundColor: colour.hex ?? 'var(--color-surface-sunken)'}}
                  />
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {hasVariants && selected && (
        <fieldset className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <legend id={labelId} className="text-sm font-semibold text-ink">
              Size
            </legend>
            <p className="text-sm text-ink-muted" aria-live="polite">
              <span className="font-medium text-ink tabular-nums">{selected.priceLabel}</span>
              <span className="mx-1.5 text-ink-faint">·</span>
              {selected.inStock ? (
                <span className="text-success">
                  {selected.stock <= 5 ? `Only ${selected.stock} left` : 'In stock'}
                </span>
              ) : (
                <span>Out of stock</span>
              )}
            </p>
          </div>

          <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
            {sizesForColour.map((variant) => {
              const checked = variant.id === selected.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    setVariantId(variant.id)
                    setQuantity(1)
                  }}
                  className={`relative min-w-12 rounded-control border px-3.5 py-2 text-sm font-medium transition-colors ${
                    checked
                      ? 'border-accent bg-accent-soft text-accent-strong'
                      : 'border-line bg-surface text-ink hover:border-line-strong'
                  } ${variant.inStock ? '' : 'text-ink-faint'}`}
                >
                  {variant.size}
                  {!variant.inStock && (
                    <>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-2 top-1/2 h-px -rotate-12 bg-current opacity-60"
                      />
                      <span className="sr-only"> (out of stock)</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
          {selected.sku && <p className="font-mono text-xs text-ink-faint">SKU {selected.sku}</p>}
        </fieldset>
      )}

      {canBuy ? (
        <form action={bagAction} className="flex flex-col gap-4 border-t border-line pt-5">
          <input type="hidden" name="productSlug" value={productSlug} />
          {selected && <input type="hidden" name="variantId" value={selected.id} />}
          <input type="hidden" name="quantity" value={quantity} />

          {customisable && (
            <div className="flex flex-col gap-3 rounded-control bg-surface-muted/60 p-3.5">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={wantsPrint}
                  onChange={(event) => setWantsPrint(event.target.checked)}
                  className="mt-0.5 accent-[var(--color-accent)]"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-ink">Add a printed name and number</span>
                  <span className="text-xs text-ink-muted">{customisationFeeLabel} per jersey, official font.</span>
                </span>
              </label>
              {wantsPrint && (
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <TextField
                    id={`${fieldId}-print-name`}
                    name="printName"
                    label="Name on back"
                    maxLength={14}
                    placeholder="MESSI"
                    style={{textTransform: 'uppercase'}}
                    error={bagState.fieldErrors.printName}
                    optional
                  />
                  <TextField
                    id={`${fieldId}-print-number`}
                    name="printNumber"
                    label="Number"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="10"
                    error={bagState.fieldErrors.printNumber}
                    optional
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex h-11 items-center rounded-control border border-line bg-surface">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="h-full w-10 text-ink-muted hover:text-ink"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                className="h-full w-10 text-ink-muted hover:text-ink"
              >
                +
              </button>
            </div>
            <button
              type="submit"
              disabled={bagPending}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-control border border-ink bg-transparent px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-canvas disabled:opacity-60"
            >
              {bagPending ? 'Adding…' : 'Add to bag'}
            </button>
            <button
              type="submit"
              formAction={buyNowAction}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong"
            >
              Buy now
            </button>
          </div>

          {bagState.status === 'success' ? (
            <p role="status" className="flex items-center justify-between rounded-control border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success">
              <span>{bagState.message}</span>
              <Link href="/cart" className="font-semibold underline-offset-4 hover:underline">
                View bag
              </Link>
            </p>
          ) : (
            <FormNotice status={bagState.status} message={bagState.message} />
          )}
        </form>
      ) : (
        <div className="border-t border-line pt-5">
          <NotifyMeForm
            productSlug={productSlug}
            variantId={selected?.id ?? null}
            sizeLabel={selected?.size ?? null}
            action={notifyAction}
          />
        </div>
      )}
    </div>
  )
}
