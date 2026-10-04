import type {ImageRef} from './image'
import type {Money} from './money'
import type {SeoMetadata} from './seo'

export const paymentMethods = ['cod', 'bkash', 'nagad', 'card', 'bankTransfer'] as const
export type PaymentMethod = (typeof paymentMethods)[number]

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (paymentMethods as readonly string[]).includes(value)
}

export const shippingZones = ['insideDhaka', 'outsideDhaka'] as const
export type ShippingZone = (typeof shippingZones)[number]

export function isShippingZone(value: unknown): value is ShippingZone {
  return typeof value === 'string' && (shippingZones as readonly string[]).includes(value)
}

export interface ShippingRates {
  readonly insideDhaka: Money
  readonly outsideDhaka: Money
  /** Subtotal at which delivery becomes free. Null disables the rule. */
  readonly freeFrom: Money | null
}

export interface PaymentInstructions {
  readonly bkashNumber: string | null
  readonly nagadNumber: string | null
  readonly bankDetails: string | null
}

export interface Announcement {
  readonly text: string
  readonly href: string | null
}

export interface SiteSettings {
  readonly storeName: string
  readonly tagline: string | null
  readonly heroHeading: string | null
  readonly heroText: string | null
  readonly logo: ImageRef | null
  readonly announcement: Announcement | null
  readonly contactEmail: string | null
  readonly contactPhone: string | null
  readonly whatsapp: string | null
  readonly social: Readonly<Record<'facebook' | 'instagram' | 'tiktok' | 'youtube', string | null>>
  readonly shipping: ShippingRates
  readonly enabledPaymentMethods: readonly PaymentMethod[]
  readonly paymentInstructions: PaymentInstructions
  readonly jerseyCustomisationFee: Money
  readonly defaultSeo: SeoMetadata
}

/** Delivery fee for a zone, honouring the free-delivery threshold. */
export function shippingFeeFor(settings: SiteSettings, zone: ShippingZone, subtotal: Money): Money {
  const {shipping} = settings
  if (shipping.freeFrom && subtotal.amount >= shipping.freeFrom.amount) {
    return {amount: 0, currency: subtotal.currency}
  }
  return zone === 'insideDhaka' ? shipping.insideDhaka : shipping.outsideDhaka
}
