import {describe, expect, it} from 'vitest'

import {
  addToCart,
  cartCount,
  cartLineKey,
  emptyCart,
  removeFromCart,
  sanitiseCart,
  setCartQuantity,
} from './cart'

const item = (overrides = {}) => ({productSlug: 'tee', variantId: 'v1', quantity: 1, print: null, ...overrides})

describe('addToCart', () => {
  it('merges the same product, size and print into one line', () => {
    const cart = addToCart(addToCart(emptyCart, item()), item({quantity: 2}))
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0].quantity).toBe(3)
  })

  it('keeps different sizes and print requests as separate lines', () => {
    const cart = addToCart(
      addToCart(addToCart(emptyCart, item()), item({variantId: 'v2'})),
      item({print: {name: 'messi', number: '10'}}),
    )
    expect(cart.items).toHaveLength(3)
    expect(cart.items[2].print).toEqual({name: 'MESSI', number: '10'})
  })

  it('caps a line at the maximum quantity', () => {
    const cart = addToCart(addToCart(emptyCart, item({quantity: 15})), item({quantity: 15}))
    expect(cart.items[0].quantity).toBe(20)
  })
})

describe('quantity and removal', () => {
  it('sets a quantity and removes the line at zero', () => {
    const cart = addToCart(emptyCart, item())
    const key = cartLineKey(cart.items[0])
    expect(setCartQuantity(cart, key, 4).items[0].quantity).toBe(4)
    expect(setCartQuantity(cart, key, 0).items).toHaveLength(0)
    expect(removeFromCart(cart, key).items).toHaveLength(0)
  })

  it('counts units across lines', () => {
    const cart = addToCart(addToCart(emptyCart, item({quantity: 2})), item({variantId: 'v2', quantity: 3}))
    expect(cartCount(cart)).toBe(5)
  })
})

describe('sanitiseCart', () => {
  it('drops malformed entries and keeps valid ones', () => {
    const cart = sanitiseCart({
      items: [
        {productSlug: 'tee', variantId: 'v1', quantity: 2},
        {productSlug: 'BAD SLUG!', quantity: 1},
        {productSlug: 'ok', quantity: '3', print: {name: 'x', number: 7}},
        null,
        {productSlug: 'zero', quantity: 0},
      ],
    })
    expect(cart.items).toEqual([
      {productSlug: 'tee', variantId: 'v1', quantity: 2, print: null},
      {productSlug: 'ok', variantId: null, quantity: 3, print: {name: 'X', number: null}},
    ])
  })

  it('returns an empty cart for garbage', () => {
    expect(sanitiseCart('nope')).toEqual(emptyCart)
    expect(sanitiseCart({items: 'nope'})).toEqual(emptyCart)
  })
})
