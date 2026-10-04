import {Badge} from './badge'

interface PriceProps {
  readonly priceLabel: string
  readonly compareAtLabel: string | null
  readonly discountLabel: string | null
  /** Prefix with "from" when variants span a range. */
  readonly isFrom?: boolean
  readonly size?: 'sm' | 'lg'
}

export function Price({
  priceLabel,
  compareAtLabel,
  discountLabel,
  isFrom = false,
  size = 'sm',
}: PriceProps) {
  const priceClass =
    size === 'lg' ? 'text-3xl font-semibold tracking-tight' : 'text-base font-semibold'
  const wasClass = size === 'lg' ? 'text-lg' : 'text-sm'

  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <span className={`${priceClass} text-ink tabular-nums`}>
        {isFrom && <span className="mr-1 text-sm font-normal text-ink-muted">from</span>}
        {priceLabel}
      </span>
      {compareAtLabel && (
        <s className={`${wasClass} text-ink-faint tabular-nums`} aria-label={`Was ${compareAtLabel}`}>
          {compareAtLabel}
        </s>
      )}
      {discountLabel && size === 'lg' && <Badge tone="sale">{discountLabel}</Badge>}
    </div>
  )
}
