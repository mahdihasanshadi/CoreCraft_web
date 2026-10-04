import {OrderValidationError} from '@/core/domain/errors'
import {createMoney, type Money} from '@/core/domain/money'
import {
  generateOrderNumber,
  lineTotalFor,
  totalsFor,
  type Address,
  type Customisation,
  type NewOrder,
  type OrderCustomer,
  type OrderLine,
} from '@/core/domain/order'
import type {Product, ProductVariant} from '@/core/domain/product'
import {shippingFeeFor, type PaymentMethod} from '@/core/domain/site-settings'
import type {CustomerRepository, OrderRepository} from '@/core/ports/commerce-repositories'
import type {PaymentGateway, PaymentOutcome} from '@/core/ports/payment-gateway'
import type {ProductRepository} from '@/core/ports/product-repository'
import type {SiteSettingsRepository} from '@/core/ports/site-settings-repository'

export interface PlaceOrderItem {
  readonly productSlug: string
  readonly variantId: string | null
  readonly quantity: number
  readonly customisation: {readonly name: string | null; readonly number: string | null} | null
}

export interface PlaceOrderInput {
  readonly items: readonly PlaceOrderItem[]
  readonly customer: OrderCustomer
  readonly shippingAddress: Address
  readonly paymentMethod: PaymentMethod
  readonly paymentSenderNumber: string | null
  readonly paymentReference: string | null
  readonly customerNote: string | null
}

export interface PlaceOrderResult {
  readonly orderId: string
  readonly orderNumber: string
  readonly total: Money
  readonly payment: PaymentOutcome
}

export interface PlaceOrderDeps {
  readonly products: ProductRepository
  readonly customers: CustomerRepository
  readonly orders: OrderRepository
  readonly settings: SiteSettingsRepository
  readonly gateways: readonly PaymentGateway[]
  readonly now?: () => Date
}

export type PlaceOrder = (input: PlaceOrderInput) => Promise<PlaceOrderResult>

const MAX_QUANTITY_PER_LINE = 20
const MAX_PRINT_NAME_LENGTH = 14
const MAX_PRINT_NUMBER_LENGTH = 2

function variantTitle(variant: ProductVariant): string {
  return [variant.size, variant.colour].filter(Boolean).join(' / ')
}

/**
 * Turns a shopper's request into a priced, stock-checked order.
 *
 * Nothing from the request is trusted for money: every price is re-read from
 * the catalogue, every fee comes from settings, and every total is computed
 * here. The client only ever says what it wants and how many.
 */
export function makePlaceOrder({
  products,
  customers,
  orders,
  settings: settingsRepository,
  gateways,
  now = () => new Date(),
}: PlaceOrderDeps): PlaceOrder {
  return async function placeOrder(input) {
    const problems: {field: string; message: string}[] = []
    const settings = await settingsRepository.get()

    if (input.items.length === 0) {
      problems.push({field: 'items', message: 'Your bag is empty.'})
    }

    if (!settings.enabledPaymentMethods.includes(input.paymentMethod)) {
      problems.push({field: 'paymentMethod', message: 'That payment method is not available right now.'})
    }

    const gateway = gateways.find((candidate) => candidate.supports.includes(input.paymentMethod))
    if (!gateway) {
      problems.push({field: 'paymentMethod', message: 'That payment method is not set up yet.'})
    }

    const lines: OrderLine[] = []
    for (const [index, item] of input.items.entries()) {
      const field = `items.${index}`
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY_PER_LINE) {
        problems.push({field, message: `Quantity must be between 1 and ${MAX_QUANTITY_PER_LINE}.`})
        continue
      }

      const product = await products.findBySlug(item.productSlug)
      if (!product || product.status !== 'active') {
        problems.push({field, message: 'One of the items is no longer available.'})
        continue
      }

      const variant = resolveVariant(product, item.variantId, field, problems)
      if (variant === undefined) continue

      const available = variant ? variant.stock : product.stock
      if (available < item.quantity) {
        problems.push({
          field,
          message:
            available === 0
              ? `${product.name} is sold out.`
              : `Only ${available} of ${product.name} left.`,
        })
        continue
      }

      const customisation = resolveCustomisation(product, item, settings.jerseyCustomisationFee, field, problems)
      if (customisation === undefined) continue

      const unitPrice = variant?.price ?? product.price
      lines.push({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: variant?.id ?? null,
        variantTitle: variant ? variantTitle(variant) : null,
        size: variant?.size ?? null,
        colour: variant?.colour ?? null,
        sku: variant?.sku ?? product.sku,
        unitPrice,
        quantity: item.quantity,
        customisation,
        lineTotal: lineTotalFor(unitPrice, item.quantity, customisation),
      })
    }

    if (problems.length > 0 || !gateway) {
      throw new OrderValidationError(problems)
    }

    const currency = lines[0].unitPrice.currency
    const subtotal = createMoney(
      lines.reduce((sum, line) => sum + line.lineTotal.amount, 0),
      currency,
    )
    const shippingFee = shippingFeeFor(settings, input.shippingAddress.zone, subtotal)
    const totals = totalsFor(lines, shippingFee, createMoney(0, currency))

    const placedAt = now()
    const order: NewOrder = {
      orderNumber: generateOrderNumber(placedAt),
      placedAt,
      customer: input.customer,
      lines,
      totals,
      shippingAddress: input.shippingAddress,
      payment: {
        method: input.paymentMethod,
        status: input.paymentMethod === 'cod' ? 'unpaid' : 'pending',
        reference: input.paymentReference,
        senderNumber: input.paymentSenderNumber,
      },
      customerNote: input.customerNote,
    }

    const customer =
      (await customers.findByPhone(input.customer.phone)) ??
      (await customers.create(input.customer, 'storefront'))

    const {id: orderId} = await orders.create(order, customer.id)
    const payment = await gateway.begin(order, settings)

    return {orderId, orderNumber: order.orderNumber, total: totals.total, payment}
  }
}

/**
 * Returns the chosen variant, null for a product without variants, or
 * undefined (after recording a problem) when the choice is invalid.
 */
function resolveVariant(
  product: Product,
  variantId: string | null,
  field: string,
  problems: {field: string; message: string}[],
): ProductVariant | null | undefined {
  if (product.variants.length === 0) return null
  if (!variantId) {
    problems.push({field, message: `Choose a size for ${product.name}.`})
    return undefined
  }
  const variant = product.variants.find((candidate) => candidate.id === variantId)
  if (!variant) {
    problems.push({field, message: `That size of ${product.name} is no longer offered.`})
    return undefined
  }
  return variant
}

function resolveCustomisation(
  product: Product,
  item: PlaceOrderItem,
  fee: Money,
  field: string,
  problems: {field: string; message: string}[],
): Customisation | null | undefined {
  const requested = item.customisation
  const wantsPrint = Boolean(requested && (requested.name || requested.number))
  if (!wantsPrint) return null

  if (!product.jersey?.customisable) {
    problems.push({field, message: `${product.name} cannot be printed with a name and number.`})
    return undefined
  }
  const name = requested?.name?.trim().toUpperCase() ?? null
  const number = requested?.number?.trim() ?? null
  if (name && name.length > MAX_PRINT_NAME_LENGTH) {
    problems.push({field, message: `Printed names are at most ${MAX_PRINT_NAME_LENGTH} characters.`})
    return undefined
  }
  if (number && !/^\d{1,2}$/.test(number)) {
    problems.push({field, message: `Numbers are 1 to ${MAX_PRINT_NUMBER_LENGTH} digits.`})
    return undefined
  }
  return {name: name || null, number: number || null, fee}
}
