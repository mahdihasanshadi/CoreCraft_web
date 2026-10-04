import {describe, expect, it} from 'vitest'

import {OrderValidationError} from '@/core/domain/errors'
import {createMoney} from '@/core/domain/money'
import type {NewOrder} from '@/core/domain/order'
import type {Product} from '@/core/domain/product'
import {emptySeoMetadata} from '@/core/domain/seo'
import type {SiteSettings} from '@/core/domain/site-settings'
import type {CustomerRecord, CustomerRepository, OrderRepository} from '@/core/ports/commerce-repositories'
import type {PaymentGateway} from '@/core/ports/payment-gateway'
import type {ProductRepository} from '@/core/ports/product-repository'
import type {SiteSettingsRepository} from '@/core/ports/site-settings-repository'

import {makePlaceOrder, type PlaceOrderInput} from './place-order'

const bdt = (amount: number) => createMoney(amount, 'BDT')

const jersey: Product = {
  id: 'prod-arg',
  slug: 'argentina-home',
  name: 'Argentina Home Jersey',
  excerpt: null,
  description: [],
  status: 'active',
  productType: 'footballJersey',
  featured: true,
  price: bdt(1450),
  compareAtPrice: bdt(1650),
  sku: 'ARG',
  stock: 0,
  images: [],
  fabric: null,
  gsm: null,
  fit: null,
  audience: null,
  careInstructions: [],
  sizeChart: null,
  jersey: {team: 'Argentina', season: '2026', kitType: 'home', customisable: true},
  brand: null,
  categories: [],
  variants: [
    {id: 'v-m', size: 'M', colour: 'Home', colourHex: null, sku: 'ARG-M', price: null, stock: 5},
    {id: 'v-xl', size: 'XL', colour: 'Home', colourHex: null, sku: 'ARG-XL', price: bdt(1550), stock: 0},
  ],
  seo: emptySeoMetadata,
}

const tee: Product = {
  ...jersey,
  id: 'prod-tee',
  slug: 'plain-tee',
  name: 'Plain Tee',
  productType: 'tshirt',
  price: bdt(650),
  compareAtPrice: null,
  jersey: null,
  variants: [],
  stock: 3,
}

const settings: SiteSettings = {
  storeName: 'CoreCraft',
  tagline: null,
  heroHeading: null,
  heroText: null,
  logo: null,
  announcement: null,
  contactEmail: null,
  contactPhone: null,
  whatsapp: null,
  social: {facebook: null, instagram: null, tiktok: null, youtube: null},
  shipping: {insideDhaka: bdt(70), outsideDhaka: bdt(130), freeFrom: bdt(2500)},
  enabledPaymentMethods: ['cod', 'bkash'],
  paymentInstructions: {bkashNumber: '01700', nagadNumber: null, bankDetails: null},
  jerseyCustomisationFee: bdt(150),
  defaultSeo: emptySeoMetadata,
}

function harness(overrides: {products?: Product[]; existingCustomer?: CustomerRecord | null} = {}) {
  const catalogue = overrides.products ?? [jersey, tee]
  const saved: {order: NewOrder; customerId: string}[] = []
  const createdCustomers: CustomerRecord[] = []

  const products: ProductRepository = {
    listPurchasable: async () => [],
    listPurchasableSlugs: async () => [],
    findSeoBySlug: async () => null,
    findBySlug: async (slug) => catalogue.find((product) => product.slug === slug) ?? null,
  }
  const customers: CustomerRepository = {
    findByPhone: async () => overrides.existingCustomer ?? null,
    create: async (customer) => {
      const record = {id: `cust-${createdCustomers.length + 1}`, ...customer}
      createdCustomers.push(record)
      return record
    },
  }
  const orders: OrderRepository = {
    create: async (order, customerId) => {
      saved.push({order, customerId})
      return {id: `order-${saved.length}`}
    },
    findByNumber: async () => null,
  }
  const settingsRepository: SiteSettingsRepository = {get: async () => settings}
  const gateway: PaymentGateway = {
    supports: ['cod', 'bkash'],
    begin: async () => ({kind: 'instructions', title: 'Pay', steps: [], payTo: null}),
  }

  const placeOrder = makePlaceOrder({
    products,
    customers,
    orders,
    settings: settingsRepository,
    gateways: [gateway],
    now: () => new Date('2026-10-04T10:00:00Z'),
  })

  return {placeOrder, saved, createdCustomers}
}

const baseInput: PlaceOrderInput = {
  items: [{productSlug: 'argentina-home', variantId: 'v-m', quantity: 2, customisation: null}],
  customer: {name: 'Mahdi', phone: '01700000000', email: null},
  shippingAddress: {
    fullName: 'Mahdi',
    phone: '01700000000',
    line1: 'House 1',
    line2: null,
    area: null,
    city: 'Dhaka',
    postalCode: null,
    zone: 'insideDhaka',
    country: 'Bangladesh',
  },
  paymentMethod: 'cod',
  paymentSenderNumber: null,
  paymentReference: null,
  customerNote: null,
}

describe('placeOrder', () => {
  it('prices from the catalogue, not the request, and charges zone delivery', async () => {
    const {placeOrder, saved} = harness()
    const result = await placeOrder(baseInput)

    expect(saved).toHaveLength(1)
    const {order} = saved[0]
    expect(order.lines[0].unitPrice).toEqual(bdt(1450))
    expect(order.lines[0].lineTotal).toEqual(bdt(2900))
    expect(order.totals.shippingFee).toEqual(bdt(0)) // 2900 ≥ 2500 free threshold
    expect(order.totals.total).toEqual(bdt(2900))
    expect(result.orderNumber).toMatch(/^CC-261004-/)
    expect(result.payment.kind).toBe('instructions')
  })

  it('charges delivery below the free threshold', async () => {
    const {placeOrder, saved} = harness()
    await placeOrder({...baseInput, items: [{...baseInput.items[0], quantity: 1}]})
    expect(saved[0].order.totals.shippingFee).toEqual(bdt(70))
    expect(saved[0].order.totals.total).toEqual(bdt(1520))
  })

  it('uses the variant price when one is set', async () => {
    const {placeOrder} = harness({
      products: [{...jersey, variants: [{...jersey.variants[1], stock: 2}]}],
    })
    const {saved} = harness()
    void saved
    await expect(
      placeOrder({...baseInput, items: [{...baseInput.items[0], variantId: 'v-xl', quantity: 1}]}),
    ).resolves.toMatchObject({total: bdt(1620)}) // 1550 + 70 delivery
  })

  it('rejects a sold-out variant with a field-level problem', async () => {
    const {placeOrder, saved} = harness()
    const attempt = placeOrder({...baseInput, items: [{...baseInput.items[0], variantId: 'v-xl'}]})
    await expect(attempt).rejects.toBeInstanceOf(OrderValidationError)
    await attempt.catch((error: OrderValidationError) => {
      expect(error.problems[0]).toMatchObject({field: 'items.0'})
      expect(error.problems[0].message).toMatch(/sold out/i)
    })
    expect(saved).toHaveLength(0)
  })

  it('rejects more units than are in stock', async () => {
    const {placeOrder} = harness()
    await expect(
      placeOrder({...baseInput, items: [{...baseInput.items[0], quantity: 6}]}),
    ).rejects.toThrow(/Only 5/)
  })

  it('requires a size when the product has variants', async () => {
    const {placeOrder} = harness()
    await expect(
      placeOrder({...baseInput, items: [{...baseInput.items[0], variantId: null}]}),
    ).rejects.toThrow(/Choose a size/)
  })

  it('adds the printing fee from settings only on customisable jerseys', async () => {
    const {placeOrder, saved} = harness()
    await placeOrder({
      ...baseInput,
      items: [{...baseInput.items[0], quantity: 1, customisation: {name: 'messi', number: '10'}}],
    })
    const line = saved[0].order.lines[0]
    expect(line.customisation).toEqual({name: 'MESSI', number: '10', fee: bdt(150)})
    expect(line.lineTotal).toEqual(bdt(1600))

    await expect(
      placeOrder({
        ...baseInput,
        items: [{productSlug: 'plain-tee', variantId: null, quantity: 1, customisation: {name: 'X', number: '1'}}],
      }),
    ).rejects.toThrow(/cannot be printed/)
  })

  it('rejects a payment method the store has not enabled', async () => {
    const {placeOrder} = harness()
    await expect(placeOrder({...baseInput, paymentMethod: 'card'})).rejects.toThrow(/not available/)
  })

  it('reuses an existing customer matched by phone', async () => {
    const existing = {id: 'cust-existing', name: 'Mahdi', phone: '+8801700000000', email: null}
    const {placeOrder, saved, createdCustomers} = harness({existingCustomer: existing})
    await placeOrder(baseInput)
    expect(saved[0].customerId).toBe('cust-existing')
    expect(createdCustomers).toHaveLength(0)
  })

  it('marks cash on delivery unpaid and wallet payments pending', async () => {
    const {placeOrder, saved} = harness()
    await placeOrder(baseInput)
    await placeOrder({...baseInput, paymentMethod: 'bkash', paymentReference: 'TX123'})
    expect(saved[0].order.payment.status).toBe('unpaid')
    expect(saved[1].order.payment).toMatchObject({status: 'pending', reference: 'TX123'})
  })
})
