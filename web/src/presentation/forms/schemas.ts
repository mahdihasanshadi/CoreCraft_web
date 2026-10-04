import {z} from 'zod'

import {MIN_PASSWORD_LENGTH} from '@/core/domain/account'
import {MAX_QUANTITY_PER_LINE} from '@/core/domain/cart'
import {contactChannels, interestKinds} from '@/core/domain/service'
import {shippingZones} from '@/core/domain/site-settings'

/**
 * Shapes of what the browser is allowed to send.
 *
 * These guard the boundary only. Business rules such as stock, price and
 * whether a jersey can be printed live in the use cases, where they are
 * enforced regardless of which form called them.
 */

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/

const trimmed = (max: number) => z.string().trim().max(max)
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((value) => (value ? value : null))

export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine((value) => BD_PHONE.test(value), 'Enter a valid Bangladeshi mobile number.')

export const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.toLowerCase() : null))
  .refine((value) => value === null || z.string().email().safeParse(value).success, {
    message: 'Enter a valid email address.',
  })

export const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value.replace(/[\s-]/g, '') : null))
  .refine((value) => value === null || BD_PHONE.test(value), {
    message: 'Enter a valid Bangladeshi mobile number.',
  })

const quantitySchema = z
  .string()
  .trim()
  .transform((value) => Number.parseInt(value, 10))
  .refine((value) => Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY_PER_LINE, {
    message: `Quantity must be between 1 and ${MAX_QUANTITY_PER_LINE}.`,
  })

/** Honeypot. Humans never see it; bots fill it. */
const honeypot = z.string().max(0).optional()

export const interestFormSchema = z
  .object({
    kind: z.enum(interestKinds),
    productSlug: trimmed(120).min(1),
    variantId: optionalText(80),
    phone: optionalPhone,
    email: optionalEmail,
    note: optionalText(500),
  })
  .refine((value) => value.kind !== 'notifyMe' || value.phone || value.email, {
    message: 'Leave a phone number or email so we can tell you.',
    path: ['phone'],
  })

export const serviceRequestFormSchema = z.object({
  serviceSlug: optionalText(120),
  name: trimmed(120).min(2, 'Tell us your name.'),
  phone: phoneSchema,
  email: optionalEmail,
  organisation: optionalText(160),
  quantity: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : null))
    .refine((value) => value === null || (Number.isInteger(value) && value > 0), {
      message: 'Quantity must be a whole number.',
    }),
  message: optionalText(2000),
  preferredContact: z.enum(contactChannels).optional().transform((value) => value ?? null),
  website: honeypot,
})

export const addToBagSchema = z.object({
  productSlug: trimmed(120).min(1),
  variantId: optionalText(80),
  quantity: quantitySchema,
  printName: optionalText(14),
  printNumber: optionalText(2),
})

export const cartLineSchema = z.object({
  key: trimmed(400).min(1),
  quantity: z
    .string()
    .trim()
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isInteger(value) && value >= 0 && value <= MAX_QUANTITY_PER_LINE),
})

export const checkoutFormSchema = z.object({
  name: trimmed(120).min(2, 'Tell us who to deliver to.'),
  phone: phoneSchema,
  email: optionalEmail,
  line1: trimmed(200).min(4, 'Enter a street address.'),
  line2: optionalText(200),
  area: optionalText(120),
  city: trimmed(120).min(2, 'Enter a city or district.'),
  postalCode: optionalText(20),
  zone: z.enum(shippingZones),
  note: optionalText(500),
  website: honeypot,
})

export const loginFormSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Enter your password.'),
  next: optionalText(200),
})

export const registerFormSchema = z
  .object({
    name: trimmed(120).min(2, 'Tell us your name.'),
    phone: phoneSchema,
    email: optionalEmail,
    password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`).max(200),
    confirmPassword: z.string(),
    next: optionalText(200),
    website: honeypot,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

/** Only ever send people to a path on this site after sign-in. */
export function safeNextPath(value: string | null | undefined, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

/** Flattens zod issues to one message per field, first issue wins. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'form'
    if (!(key in errors)) errors[key] = issue.message
  }
  return errors
}
