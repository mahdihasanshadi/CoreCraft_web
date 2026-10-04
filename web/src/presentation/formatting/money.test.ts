import {describe, expect, it} from 'vitest'

import {createMoney} from '@/core/domain/money'

import {formatMoney} from './money'

describe('formatMoney', () => {
  it('renders taka with the ৳ sign and Indian-style grouping', () => {
    expect(formatMoney(createMoney(1450, 'BDT'), 'en-IN')).toBe('৳1,450')
    expect(formatMoney(createMoney(145000, 'BDT'), 'en-IN')).toBe('৳1,45,000')
  })

  it('keeps decimals only when present', () => {
    expect(formatMoney(createMoney(99.5, 'BDT'), 'en-IN')).toBe('৳99.5')
  })

  it('still formats other currencies through Intl', () => {
    expect(formatMoney(createMoney(12, 'USD'), 'en-US')).toBe('$12')
  })

  it('does not crash on an unknown currency', () => {
    expect(() => formatMoney(createMoney(1, 'ZZZ'), 'en-US')).not.toThrow()
  })
})
