import 'server-only'

import {createMoney, type CurrencyCode} from '@/core/domain/money'
import {
  orderStatuses,
  paymentStatuses,
  type Address,
  type NewOrder,
  type OrderCustomer,
  type OrderLine,
  type PlacedOrder,
} from '@/core/domain/order'
import type {NewProductInterest, NewServiceRequest} from '@/core/domain/service'
import {isPaymentMethod, isShippingZone} from '@/core/domain/site-settings'
import type {
  CustomerRecord,
  CustomerRepository,
  OrderRepository,
  ProductInterestRepository,
  ServiceRequestRepository,
} from '@/core/ports/commerce-repositories'

import {commerceClient} from './commerce-client'

/** Phone numbers are matched loosely: digits only, local prefix normalised. */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.startsWith('880')) return `+${digits}`
  if (digits.startsWith('0')) return `+88${digits}`
  return `+${digits}`
}

export function createSanityCustomerRepository(): CustomerRepository {
  return {
    async findByPhone(phone): Promise<CustomerRecord | null> {
      const normalised = normalisePhone(phone)
      const row = await commerceClient().fetch<CustomerRecord | null>(
        `*[_type == "customer" && phone == $phone][0]{"id": _id, name, phone, email}`,
        {phone: normalised},
      )
      return row ?? null
    },

    async create(customer: OrderCustomer, source): Promise<CustomerRecord> {
      const created = await commerceClient().create({
        _type: 'customer',
        name: customer.name,
        phone: normalisePhone(customer.phone),
        email: customer.email ?? undefined,
        marketingConsent: 'unknown',
        source,
      })
      return {id: created._id, name: customer.name, phone: created.phone as string, email: customer.email}
    },
  }
}

function addressToDocument(address: Address) {
  return {
    _type: 'address',
    fullName: address.fullName,
    phone: normalisePhone(address.phone),
    line1: address.line1,
    line2: address.line2 ?? undefined,
    area: address.area ?? undefined,
    city: address.city,
    postalCode: address.postalCode ?? undefined,
    zone: address.zone,
    country: address.country,
  }
}

function lineToDocument(line: OrderLine, index: number) {
  return {
    _type: 'orderLineItem',
    _key: `line-${index + 1}`,
    productId: line.productId,
    productSlug: line.productSlug,
    productName: line.productName,
    variantId: line.variantId ?? undefined,
    variantTitle: line.variantTitle ?? undefined,
    size: line.size ?? undefined,
    colour: line.colour ?? undefined,
    sku: line.sku ?? undefined,
    customisation: line.customisation
      ? {
          name: line.customisation.name ?? undefined,
          number: line.customisation.number ?? undefined,
          fee: line.customisation.fee.amount,
        }
      : undefined,
    unitPrice: line.unitPrice.amount,
    quantity: line.quantity,
    lineTotal: line.lineTotal.amount,
  }
}

interface RawOrder {
  _id: string
  orderNumber: string
  status: string
  placedAt: string
  currency?: string | null
  subtotal: number
  shippingFee?: number | null
  discount?: number | null
  total: number
  customerNote?: string | null
  customer?: {name?: string | null} | null
  items?: {
    productId?: string | null
    productSlug?: string | null
    productName?: string | null
    variantId?: string | null
    variantTitle?: string | null
    size?: string | null
    colour?: string | null
    sku?: string | null
    unitPrice?: number | null
    quantity?: number | null
    lineTotal?: number | null
    customisation?: {name?: string | null; number?: string | null; fee?: number | null} | null
  }[]
  shippingAddress?: Partial<Record<keyof Address, string | null>> | null
  payment?: {
    method?: string | null
    status?: string | null
    reference?: string | null
    senderNumber?: string | null
  } | null
}

export function createSanityOrderRepository({currency}: {currency: CurrencyCode}): OrderRepository {
  return {
    async create(order: NewOrder, customerId: string): Promise<{id: string}> {
      const created = await commerceClient().create({
        _type: 'order',
        orderNumber: order.orderNumber,
        status: 'pending',
        placedAt: order.placedAt.toISOString(),
        customer: {_type: 'reference', _ref: customerId},
        items: order.lines.map(lineToDocument),
        currency: order.totals.total.currency,
        subtotal: order.totals.subtotal.amount,
        shippingFee: order.totals.shippingFee.amount,
        discount: order.totals.discount.amount,
        total: order.totals.total.amount,
        shippingAddress: addressToDocument(order.shippingAddress),
        customerNote: order.customerNote ?? undefined,
        payment: {
          _type: 'paymentDetails',
          method: order.payment.method,
          status: order.payment.status,
          reference: order.payment.reference ?? undefined,
          senderNumber: order.payment.senderNumber ?? undefined,
        },
        source: 'storefront',
      })
      return {id: created._id}
    },

    async findByNumber(orderNumber: string): Promise<PlacedOrder | null> {
      const raw = await commerceClient().fetch<RawOrder | null>(
        `*[_type == "order" && orderNumber == $orderNumber][0]{
          ..., "customer": customer->{name}
        }`,
        {orderNumber},
      )
      if (!raw) return null

      const money = (amount: number | null | undefined) => createMoney(amount ?? 0, raw.currency ?? currency)
      const status = (orderStatuses as readonly string[]).includes(raw.status) ? raw.status : 'pending'
      const paymentStatus = (paymentStatuses as readonly string[]).includes(raw.payment?.status ?? '')
        ? raw.payment?.status
        : 'unpaid'
      const zone = raw.shippingAddress?.zone
      const method = raw.payment?.method

      return {
        id: raw._id,
        orderNumber: raw.orderNumber,
        placedAt: new Date(raw.placedAt),
        status: status as PlacedOrder['status'],
        customerName: raw.customer?.name ?? raw.shippingAddress?.fullName ?? 'Customer',
        lines: (raw.items ?? []).map((item) => ({
          productId: item.productId ?? '',
          productSlug: item.productSlug ?? '',
          productName: item.productName ?? 'Item',
          variantId: item.variantId ?? null,
          variantTitle: item.variantTitle ?? null,
          size: item.size ?? null,
          colour: item.colour ?? null,
          sku: item.sku ?? null,
          unitPrice: money(item.unitPrice),
          quantity: item.quantity ?? 1,
          customisation: item.customisation
            ? {
                name: item.customisation.name ?? null,
                number: item.customisation.number ?? null,
                fee: money(item.customisation.fee),
              }
            : null,
          lineTotal: money(item.lineTotal),
        })),
        totals: {
          subtotal: money(raw.subtotal),
          shippingFee: money(raw.shippingFee),
          discount: money(raw.discount),
          total: money(raw.total),
        },
        shippingAddress: {
          fullName: raw.shippingAddress?.fullName ?? '',
          phone: raw.shippingAddress?.phone ?? '',
          line1: raw.shippingAddress?.line1 ?? '',
          line2: raw.shippingAddress?.line2 ?? null,
          area: raw.shippingAddress?.area ?? null,
          city: raw.shippingAddress?.city ?? '',
          postalCode: raw.shippingAddress?.postalCode ?? null,
          zone: isShippingZone(zone) ? zone : 'insideDhaka',
          country: raw.shippingAddress?.country ?? 'Bangladesh',
        },
        payment: {
          method: isPaymentMethod(method) ? method : 'cod',
          status: paymentStatus as PlacedOrder['payment']['status'],
          reference: raw.payment?.reference ?? null,
          senderNumber: raw.payment?.senderNumber ?? null,
        },
      }
    },
  }
}

export function createSanityServiceRequestRepository(): ServiceRequestRepository {
  return {
    async create(request: NewServiceRequest): Promise<{id: string}> {
      const created = await commerceClient().create({
        _type: 'serviceRequest',
        status: 'new',
        submittedAt: new Date().toISOString(),
        serviceId: request.serviceId ?? undefined,
        serviceTitle: request.serviceTitle ?? undefined,
        name: request.name,
        phone: normalisePhone(request.phone),
        email: request.email ?? undefined,
        organisation: request.organisation ?? undefined,
        quantity: request.quantity ?? undefined,
        message: request.message ?? undefined,
        preferredContact: request.preferredContact ?? undefined,
        source: 'storefront',
      })
      return {id: created._id}
    },
  }
}

export function createSanityProductInterestRepository(): ProductInterestRepository {
  return {
    async record(interest: NewProductInterest): Promise<{id: string}> {
      const created = await commerceClient().create({
        _type: 'productInterest',
        submittedAt: new Date().toISOString(),
        kind: interest.kind,
        productId: interest.productId,
        productSlug: interest.productSlug,
        productName: interest.productName,
        variantId: interest.variantId ?? undefined,
        size: interest.size ?? undefined,
        colour: interest.colour ?? undefined,
        phone: interest.phone ? normalisePhone(interest.phone) : undefined,
        email: interest.email ?? undefined,
        note: interest.note ?? undefined,
        handled: 'open',
      })
      return {id: created._id}
    },
  }
}
