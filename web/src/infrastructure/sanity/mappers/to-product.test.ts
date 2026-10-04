import {describe, expect, it} from 'vitest'

import {toProduct, toProductSummary} from './to-product'

describe('toProductSummary', () => {
  it('drops records missing identity or price instead of crashing a listing', () => {
    expect(toProductSummary({_id: 'x', name: 'No slug', price: 10}, 'BDT')).toBeNull()
    expect(toProductSummary({_id: 'x', name: 'No price', slug: 'a'}, 'BDT')).toBeNull()
    expect(toProductSummary(null, 'BDT')).toBeNull()
  })

  it('maps a complete record', () => {
    const summary = toProductSummary(
      {
        _id: 'p1',
        name: 'Tee',
        slug: 'tee',
        price: 650,
        compareAtPrice: 790,
        productType: 'tshirt',
        featured: true,
        stock: 0,
        primaryImage: {assetId: 'image-abc-800x800-jpg', alt: 'Front', hotspot: {x: 0.5, y: 0.4}},
        brand: {name: 'CoreCraft', slug: 'corecraft'},
        variants: [{stock: 2, colour: 'Black', colourHex: '#111111'}],
      },
      'BDT',
    )
    expect(summary).toMatchObject({
      id: 'p1',
      slug: 'tee',
      productType: 'tshirt',
      featured: true,
      price: {amount: 650, currency: 'BDT'},
      compareAtPrice: {amount: 790, currency: 'BDT'},
      primaryImage: {assetId: 'image-abc-800x800-jpg', alt: 'Front', focalPoint: {x: 0.5, y: 0.4}},
      brand: {name: 'CoreCraft', slug: 'corecraft'},
      variants: [{stock: 2, colour: 'Black', colourHex: '#111111'}],
    })
  })

  it('falls back to "other" for an unknown product type', () => {
    const summary = toProductSummary({_id: 'p', name: 'X', slug: 'x', price: 1, productType: 'hat'}, 'BDT')
    expect(summary?.productType).toBe('other')
  })
})

describe('toProduct', () => {
  it('only builds jersey details for jersey types', () => {
    const base = {_id: 'p', name: 'X', slug: 'x', price: 1, team: 'Argentina', customisable: true}
    expect(toProduct({...base, productType: 'footballJersey'}, 'BDT')?.jersey).toEqual({
      team: 'Argentina',
      season: null,
      kitType: null,
      customisable: true,
    })
    expect(toProduct({...base, productType: 'tshirt'}, 'BDT')?.jersey).toBeNull()
  })

  it('skips variants without a size and ignores negative prices', () => {
    const product = toProduct(
      {
        _id: 'p',
        name: 'X',
        slug: 'x',
        price: 100,
        variants: [
          {_key: 'a', size: 'M', stock: 1, price: -5},
          {_key: 'b', stock: 1},
          null,
        ],
      },
      'BDT',
    )
    expect(product?.variants).toHaveLength(1)
    expect(product?.variants[0]).toMatchObject({id: 'a', size: 'M', price: null})
  })
})
