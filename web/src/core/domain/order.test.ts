import {describe, expect, it} from 'vitest'

import {createMoney} from './money'
import {generateOrderNumber, lineTotalFor, totalsFor, type OrderLine} from './order'

const bdt = (amount: number) => createMoney(amount, 'BDT')

function line(overrides: Partial<OrderLine> = {}): OrderLine {
  return {
    productId: 'p1',
    productSlug: 'tee',
    productName: 'Tee',
    variantId: 'v1',
    variantTitle: 'M / Black',
    size: 'M',
    colour: 'Black',
    sku: null,
    unitPrice: bdt(650),
    quantity: 1,
    customisation: null,
    lineTotal: bdt(650),
    ...overrides,
  }
}

describe('lineTotalFor', () => {
  it('multiplies unit price by quantity', () => {
    expect(lineTotalFor(bdt(650), 3, null)).toEqual(bdt(1950))
  })

  it('adds the printing fee per unit, not per line', () => {
    const customisation = {name: 'MESSI', number: '10', fee: bdt(150)}
    expect(lineTotalFor(bdt(1450), 2, customisation)).toEqual(bdt(3200))
  })
})

describe('totalsFor', () => {
  it('sums lines, adds delivery, subtracts discount', () => {
    const totals = totalsFor([line(), line({lineTotal: bdt(1450)})], bdt(70), bdt(100))
    expect(totals.subtotal).toEqual(bdt(2100))
    expect(totals.shippingFee).toEqual(bdt(70))
    expect(totals.discount).toEqual(bdt(100))
    expect(totals.total).toEqual(bdt(2070))
  })

  it('never produces a negative total', () => {
    const totals = totalsFor([line()], bdt(0), bdt(9999))
    expect(totals.total.amount).toBe(0)
  })
})

describe('generateOrderNumber', () => {
  it('is date-prefixed and uses a look-alike-free alphabet', () => {
    const number = generateOrderNumber(new Date('2026-10-04T12:00:00Z'), () => 0)
    expect(number).toMatch(/^CC-261004-[A-HJ-NP-Z2-9]{4}$/)
    expect(number).toBe('CC-261004-AAAA')
  })

  it('never emits 0, O, 1 or I', () => {
    for (let seed = 0; seed < 1; seed += 0.01) {
      const number = generateOrderNumber(new Date(), () => seed)
      expect(number.slice(-4)).not.toMatch(/[0O1I]/)
    }
  })
})
