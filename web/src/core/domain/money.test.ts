import {describe, expect, it} from 'vitest'

import {compareMoney, createMoney, isGreaterThan, isSameCurrency} from './money'

describe('createMoney', () => {
  it('builds an immutable amount with its currency', () => {
    expect(createMoney(1450, 'BDT')).toEqual({amount: 1450, currency: 'BDT'})
  })

  it('rejects negative and non-finite amounts', () => {
    expect(() => createMoney(-1, 'BDT')).toThrow(RangeError)
    expect(() => createMoney(Number.NaN, 'BDT')).toThrow(RangeError)
    expect(() => createMoney(Number.POSITIVE_INFINITY, 'BDT')).toThrow(RangeError)
  })

  it('allows zero, which free delivery depends on', () => {
    expect(createMoney(0, 'BDT').amount).toBe(0)
  })
})

describe('comparisons', () => {
  it('compares amounts in the same currency', () => {
    expect(isGreaterThan(createMoney(1650, 'BDT'), createMoney(1450, 'BDT'))).toBe(true)
    expect(isGreaterThan(createMoney(1450, 'BDT'), createMoney(1450, 'BDT'))).toBe(false)
    expect(compareMoney(createMoney(1, 'BDT'), createMoney(2, 'BDT'))).toBeLessThan(0)
  })

  it('refuses to compare across currencies', () => {
    expect(isSameCurrency(createMoney(1, 'BDT'), createMoney(1, 'USD'))).toBe(false)
    expect(() => compareMoney(createMoney(1, 'BDT'), createMoney(1, 'USD'))).toThrow(TypeError)
  })
})
