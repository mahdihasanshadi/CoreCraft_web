import type {Money} from '@/core/domain/money'

/**
 * `Intl.NumberFormat` construction is not free, so instances are reused per
 * locale and currency pair.
 */
const formatters = new Map<string, Intl.NumberFormat>()

/**
 * Symbols Node's ICU data does not know a narrow form for. Bangladeshi
 * storefronts write "৳1,450", never "BDT 1,450".
 */
const SYMBOL_OVERRIDES: Record<string, string> = {
  BDT: '৳',
}

function formatterFor(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`
  const existing = formatters.get(key)
  if (existing) return existing

  let created: Intl.NumberFormat
  try {
    created = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })
  } catch {
    // An unknown currency or locale should not take the page down.
    created = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    })
  }

  formatters.set(key, created)
  return created
}

export function formatMoney(money: Money, locale: string): string {
  const formatter = formatterFor(locale, money.currency)
  const override = SYMBOL_OVERRIDES[money.currency]
  if (!override) return formatter.format(money.amount)

  // Rebuild from parts so grouping and decimals stay locale-correct while the
  // currency token is replaced, and any literal space after it is dropped.
  const parts = formatter.formatToParts(money.amount)
  return parts
    .map((part, index) => {
      if (part.type === 'currency') return override
      if (part.type === 'literal' && parts[index - 1]?.type === 'currency') return ''
      return part.value
    })
    .join('')
}
