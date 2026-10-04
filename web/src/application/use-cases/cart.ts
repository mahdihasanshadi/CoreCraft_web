import {
  addToCart,
  cartCount,
  emptyCart,
  removeFromCart,
  setCartQuantity,
  type Cart,
  type CartItem,
} from '@/core/domain/cart'
import {createMoney, type Money} from '@/core/domain/money'
import {shippingFeeFor, type SiteSettings} from '@/core/domain/site-settings'
import type {CartStore} from '@/core/ports/cart-store'
import type {SiteSettingsRepository} from '@/core/ports/site-settings-repository'

import type {CartQuote, QuoteCart} from './quote-cart'

export interface CartUseCaseDeps {
  readonly cart: CartStore
  readonly settings: SiteSettingsRepository
  readonly quoteCart: QuoteCart
}

export interface CartView {
  readonly cart: Cart
  readonly quote: CartQuote
  readonly settings: SiteSettings
  readonly count: number
  readonly deliveryInsideDhaka: Money
  readonly deliveryOutsideDhaka: Money
  readonly freeDeliveryFrom: Money | null
  readonly amountToFreeDelivery: Money | null
}

export type ViewCart = () => Promise<CartView>
export type AddCartItem = (item: CartItem) => Promise<{count: number}>
export type UpdateCartItem = (key: string, quantity: number) => Promise<{count: number}>
export type RemoveCartItem = (key: string) => Promise<{count: number}>
export type ClearCart = () => Promise<void>

export function makeCartUseCases({cart: store, settings: settingsRepository, quoteCart}: CartUseCaseDeps) {
  const viewCart: ViewCart = async () => {
    const [cart, settings] = await Promise.all([store.read(), settingsRepository.get()])
    const quote = await quoteCart(cart.items, settings)
    const freeFrom = settings.shipping.freeFrom
    const remaining =
      freeFrom && quote.subtotal.amount < freeFrom.amount
        ? createMoney(freeFrom.amount - quote.subtotal.amount, quote.subtotal.currency)
        : null

    return {
      cart,
      quote,
      settings,
      count: cartCount(cart),
      deliveryInsideDhaka: shippingFeeFor(settings, 'insideDhaka', quote.subtotal),
      deliveryOutsideDhaka: shippingFeeFor(settings, 'outsideDhaka', quote.subtotal),
      freeDeliveryFrom: freeFrom,
      amountToFreeDelivery: remaining,
    }
  }

  const addCartItem: AddCartItem = async (item) => {
    const next = addToCart(await store.read(), item)
    await store.write(next)
    return {count: cartCount(next)}
  }

  const updateCartItem: UpdateCartItem = async (key, quantity) => {
    const next = setCartQuantity(await store.read(), key, quantity)
    await store.write(next)
    return {count: cartCount(next)}
  }

  const removeCartItem: RemoveCartItem = async (key) => {
    const next = removeFromCart(await store.read(), key)
    await store.write(next)
    return {count: cartCount(next)}
  }

  const clearCart: ClearCart = async () => {
    await store.write(emptyCart)
    await store.clear()
  }

  return {viewCart, addCartItem, updateCartItem, removeCartItem, clearCart}
}
