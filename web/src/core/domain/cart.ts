/** What a shopper asked for on a jersey. */
export interface PrintRequest {
  readonly name: string | null
  readonly number: string | null
}

/**
 * One line in the bag. Only identifiers and quantities live here; prices are
 * always looked up fresh, so a stale bag can never under-charge.
 */
export interface CartItem {
  readonly productSlug: string
  readonly variantId: string | null
  readonly quantity: number
  readonly print: PrintRequest | null
}

export interface Cart {
  readonly items: readonly CartItem[]
}

export const emptyCart: Cart = {items: []}

export const MAX_QUANTITY_PER_LINE = 20
export const MAX_LINES = 30

function normalisePrint(print: PrintRequest | null | undefined): PrintRequest | null {
  const name = print?.name?.trim().toUpperCase() || null
  const number = print?.number?.trim() || null
  return name || number ? {name, number} : null
}

/**
 * Identity of a line: same product, same variant, same print request. Two
 * adds of the same thing merge into one line with a bigger quantity.
 */
export function cartLineKey(item: Pick<CartItem, 'productSlug' | 'variantId' | 'print'>): string {
  const print = normalisePrint(item.print)
  return [item.productSlug, item.variantId ?? '', print?.name ?? '', print?.number ?? ''].join('|')
}

export function cartCount(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.quantity, 0)
}

export function isCartEmpty(cart: Cart): boolean {
  return cart.items.length === 0
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1
  return Math.max(0, Math.min(MAX_QUANTITY_PER_LINE, Math.round(quantity)))
}

export function addToCart(cart: Cart, item: CartItem): Cart {
  const incoming: CartItem = {
    productSlug: item.productSlug,
    variantId: item.variantId,
    quantity: clampQuantity(item.quantity) || 1,
    print: normalisePrint(item.print),
  }
  const key = cartLineKey(incoming)
  const existing = cart.items.find((line) => cartLineKey(line) === key)

  if (existing) {
    const quantity = clampQuantity(existing.quantity + incoming.quantity)
    return {
      items: cart.items.map((line) => (cartLineKey(line) === key ? {...line, quantity} : line)),
    }
  }

  if (cart.items.length >= MAX_LINES) return cart
  return {items: [...cart.items, incoming]}
}

export function setCartQuantity(cart: Cart, key: string, quantity: number): Cart {
  const next = clampQuantity(quantity)
  if (next === 0) return removeFromCart(cart, key)
  return {
    items: cart.items.map((line) => (cartLineKey(line) === key ? {...line, quantity: next} : line)),
  }
}

export function removeFromCart(cart: Cart, key: string): Cart {
  return {items: cart.items.filter((line) => cartLineKey(line) !== key)}
}

/**
 * Rebuilds a cart from untrusted storage, dropping anything malformed rather
 * than failing the whole bag.
 */
export function sanitiseCart(value: unknown): Cart {
  if (!value || typeof value !== 'object') return emptyCart
  const raw = (value as {items?: unknown}).items
  if (!Array.isArray(raw)) return emptyCart

  const items: CartItem[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const {productSlug, variantId, quantity, print} = entry as Record<string, unknown>
    if (typeof productSlug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(productSlug)) continue
    const safeVariant = typeof variantId === 'string' && variantId.length <= 80 ? variantId : null
    const safeQuantity = clampQuantity(typeof quantity === 'number' ? quantity : Number(quantity))
    if (safeQuantity === 0) continue
    const safePrint =
      print && typeof print === 'object'
        ? normalisePrint({
            name: typeof (print as PrintRequest).name === 'string' ? (print as PrintRequest).name : null,
            number:
              typeof (print as PrintRequest).number === 'string' ? (print as PrintRequest).number : null,
          })
        : null
    items.push({productSlug, variantId: safeVariant, quantity: safeQuantity, print: safePrint})
    if (items.length >= MAX_LINES) break
  }
  return {items}
}
