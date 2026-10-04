import 'server-only'

import {cookies} from 'next/headers'

import {emptyCart, sanitiseCart, type Cart} from '@/core/domain/cart'
import type {CartStore} from '@/core/ports/cart-store'

export const CART_COOKIE = 'cc_cart'
const CART_TTL_SECONDS = 60 * 60 * 24 * 30

/**
 * The bag lives in a cookie holding only slugs, variant IDs, quantities and
 * print requests. Nothing priced, nothing personal, so it is deliberately
 * readable by page scripts: the header badge counts it without a round trip.
 */
export function createCookieCartStore({secure}: {secure: boolean}): CartStore {
  return {
    async read(): Promise<Cart> {
      const jar = await cookies()
      const raw = jar.get(CART_COOKIE)?.value
      if (!raw) return emptyCart
      try {
        return sanitiseCart(JSON.parse(raw))
      } catch {
        return emptyCart
      }
    },
    async write(cart) {
      const jar = await cookies()
      if (cart.items.length === 0) {
        jar.delete(CART_COOKIE)
        return
      }
      jar.set({
        name: CART_COOKIE,
        value: JSON.stringify(cart),
        httpOnly: false,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge: CART_TTL_SECONDS,
      })
    },
    async clear() {
      const jar = await cookies()
      jar.delete(CART_COOKIE)
    },
  }
}
