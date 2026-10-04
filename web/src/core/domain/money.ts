/**
 * A currency code such as "USD" or "BDT". Kept as a string so the domain does
 * not carry a hard-coded list of currencies.
 */
export type CurrencyCode = string

/**
 * An amount of money. Immutable, and always paired with its currency so no
 * part of the system has to guess which one applies.
 */
export interface Money {
  readonly amount: number
  readonly currency: CurrencyCode
}

export function createMoney(amount: number, currency: CurrencyCode): Money {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Money amount must be a finite number, received ${amount}`)
  }
  if (amount < 0) {
    throw new RangeError(`Money amount must not be negative, received ${amount}`)
  }
  return {amount, currency}
}

export function isSameCurrency(a: Money, b: Money): boolean {
  return a.currency === b.currency
}

/**
 * Compares two amounts. Throws on a currency mismatch rather than returning a
 * meaningless answer.
 */
export function compareMoney(a: Money, b: Money): number {
  if (!isSameCurrency(a, b)) {
    throw new TypeError(`Cannot compare ${a.currency} with ${b.currency}`)
  }
  return a.amount - b.amount
}

export function isGreaterThan(a: Money, b: Money): boolean {
  return compareMoney(a, b) > 0
}
