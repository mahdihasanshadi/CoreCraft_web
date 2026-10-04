import Image from 'next/image'
import Link from 'next/link'

import type {CartLineViewModel} from '../view-models/cart'

type PlainAction = (formData: FormData) => Promise<void>

/**
 * One bag line. Quantity and removal are plain forms posting to server
 * actions, so they work before hydration and without JavaScript at all.
 */
export function CartLine({
  line,
  updateAction,
  removeAction,
}: {
  line: CartLineViewModel
  updateAction: PlainAction
  removeAction: PlainAction
}) {
  return (
    <li className="flex gap-4 py-5 sm:gap-6">
      <Link href={line.href} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-control bg-surface-sunken sm:h-28 sm:w-28">
        {line.image && <Image src={line.image.src} alt={line.image.alt} fill sizes="112px" className="object-cover" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={line.href} className="font-medium text-ink hover:underline underline-offset-4">
              {line.name}
            </Link>
            {line.variantLabel && <p className="text-sm text-ink-muted">{line.variantLabel}</p>}
            {line.printLabel && <p className="text-sm text-ink-muted">{line.printLabel}</p>}
          </div>
          <p className="shrink-0 font-medium tabular-nums text-ink">{line.lineTotalLabel}</p>
        </div>

        {line.problem && (
          <p role="alert" className="text-sm text-sale">
            {line.problem}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 pt-2">
          <div className="inline-flex h-9 items-center rounded-control border border-line bg-surface">
            <form action={updateAction}>
              <input type="hidden" name="key" value={line.key} />
              <input type="hidden" name="quantity" value={line.quantity - 1} />
              <button type="submit" aria-label={`Decrease quantity of ${line.name}`} className="h-9 w-9 text-ink-muted hover:text-ink">
                −
              </button>
            </form>
            <span className="w-8 text-center text-sm font-medium tabular-nums">{line.quantity}</span>
            <form action={updateAction}>
              <input type="hidden" name="key" value={line.key} />
              <input type="hidden" name="quantity" value={Math.min(line.maxQuantity, line.quantity + 1)} />
              <button
                type="submit"
                aria-label={`Increase quantity of ${line.name}`}
                disabled={line.quantity >= line.maxQuantity}
                className="h-9 w-9 text-ink-muted hover:text-ink disabled:opacity-40"
              >
                +
              </button>
            </form>
          </div>
          <p className="text-xs text-ink-faint">{line.unitPriceLabel} each</p>
          <form action={removeAction}>
            <input type="hidden" name="key" value={line.key} />
            <button type="submit" className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              Remove
            </button>
          </form>
        </div>
      </div>
    </li>
  )
}
