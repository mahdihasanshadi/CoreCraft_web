import type {ImageRef} from './image'
import type {Money} from './money'
import type {RichText} from './rich-text'

/** Something the brand makes to order rather than sells off the shelf. */
export interface Service {
  readonly id: string
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly description: RichText
  readonly image: ImageRef | null
  /** Null means quote only. */
  readonly startingPrice: Money | null
  readonly minimumQuantity: number | null
  readonly turnaroundDays: number | null
}

export const contactChannels = ['phone', 'whatsapp', 'email'] as const
export type ContactChannel = (typeof contactChannels)[number]

export function isContactChannel(value: unknown): value is ContactChannel {
  return typeof value === 'string' && (contactChannels as readonly string[]).includes(value)
}

/** A shopper asking about a service. Written once, then owned by the team. */
export interface NewServiceRequest {
  readonly serviceId: string | null
  readonly serviceTitle: string | null
  readonly name: string
  readonly phone: string
  readonly email: string | null
  readonly organisation: string | null
  readonly quantity: number | null
  readonly message: string | null
  readonly preferredContact: ContactChannel | null
}

export const interestKinds = ['notifyMe', 'wishlist', 'enquiry'] as const
export type InterestKind = (typeof interestKinds)[number]

export function isInterestKind(value: unknown): value is InterestKind {
  return typeof value === 'string' && (interestKinds as readonly string[]).includes(value)
}

/** One shopper signal about one product. */
export interface NewProductInterest {
  readonly kind: InterestKind
  readonly productId: string
  readonly productSlug: string
  readonly productName: string
  readonly variantId: string | null
  readonly size: string | null
  readonly colour: string | null
  readonly phone: string | null
  readonly email: string | null
  readonly note: string | null
}
