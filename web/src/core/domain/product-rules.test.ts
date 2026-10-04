import {describe, expect, it} from 'vitest'

import {createMoney} from './money'
import {availableUnits, discountPercentage, isInStock, isOnSale} from './product-rules'

const bdt = (amount: number) => createMoney(amount, 'BDT')

describe('stock rules', () => {
  it('uses the product stock when there are no variants', () => {
    expect(isInStock({stock: 3, variants: []})).toBe(true)
    expect(isInStock({stock: 0, variants: []})).toBe(false)
  })

  it('ignores product stock once variants exist', () => {
    expect(isInStock({stock: 99, variants: [{stock: 0}, {stock: 0}]})).toBe(false)
    expect(isInStock({stock: 0, variants: [{stock: 0}, {stock: 1}]})).toBe(true)
  })

  it('counts available units across variants, clamping negatives', () => {
    expect(availableUnits({stock: 0, variants: [{stock: 2}, {stock: -5}, {stock: 3}]})).toBe(5)
    expect(availableUnits({stock: 7, variants: []})).toBe(7)
  })
})

describe('pricing rules', () => {
  it('is on sale only when compare-at is strictly higher', () => {
    expect(isOnSale({price: bdt(1450), compareAtPrice: bdt(1650)})).toBe(true)
    expect(isOnSale({price: bdt(1450), compareAtPrice: bdt(1450)})).toBe(false)
    expect(isOnSale({price: bdt(1450), compareAtPrice: null})).toBe(false)
  })

  it('rounds the discount to a whole percent and never yields 0%', () => {
    expect(discountPercentage({price: bdt(1450), compareAtPrice: bdt(1650)})).toBe(12)
    expect(discountPercentage({price: bdt(650), compareAtPrice: bdt(790)})).toBe(18)
    expect(discountPercentage({price: bdt(1000), compareAtPrice: bdt(1000)})).toBeNull()
  })
})
