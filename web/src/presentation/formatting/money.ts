import type {Money} from '@/core/domain/money'

/**
 * `Intl.NumberFormat` construction is not free, so instances are reused per
 * locale and currency pair.
 */
const formatters = new Map<string, Intl.NumberFormat>()

function formatterFor(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`
  const existing = formatters.get(key)
  if (existing) return existing

  let created: Intl.NumberFormat
  try {
    created = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
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
  return formatterFor(locale, money.currency).format(money.amount)
}
