import {createMoney, type CurrencyCode} from '@/core/domain/money'
import {isPaymentMethod, type PaymentMethod, type SiteSettings} from '@/core/domain/site-settings'

import {cleanString, toImageRef, toMoney, toSeoMetadata, type RawImage, type RawSeo} from './to-product'

export interface RawSiteSettings {
  storeName?: string | null
  tagline?: string | null
  heroHeading?: string | null
  heroText?: string | null
  logo?: RawImage | null
  announcement?: {enabled?: boolean | null; text?: string | null; href?: string | null} | null
  contactEmail?: string | null
  contactPhone?: string | null
  whatsapp?: string | null
  social?: {
    facebook?: string | null
    instagram?: string | null
    tiktok?: string | null
    youtube?: string | null
  } | null
  shipping?: {
    insideDhakaFee?: number | null
    outsideDhakaFee?: number | null
    freeShippingThreshold?: number | null
  } | null
  enabledPaymentMethods?: (string | null)[] | null
  paymentInstructions?: {
    bkashNumber?: string | null
    nagadNumber?: string | null
    bankDetails?: string | null
  } | null
  jerseyCustomisationFee?: number | null
  defaultSeo?: RawSeo | null
}

export interface SiteSettingsDefaults {
  readonly storeName: string
  readonly currency: CurrencyCode
}

/**
 * Settings are the one document the whole site depends on, so a missing or
 * half-filled singleton degrades to sensible defaults instead of a crash.
 */
export function toSiteSettings(
  raw: RawSiteSettings | null | undefined,
  {storeName, currency}: SiteSettingsDefaults,
): SiteSettings {
  const methods = Array.isArray(raw?.enabledPaymentMethods)
    ? raw.enabledPaymentMethods
        .map((method) => cleanString(method))
        .filter((method): method is PaymentMethod => isPaymentMethod(method))
    : []

  const announcementText = raw?.announcement?.enabled ? (raw.announcement.text ?? null) : null

  return {
    storeName: raw?.storeName ?? storeName,
    tagline: raw?.tagline ?? null,
    heroHeading: raw?.heroHeading ?? null,
    heroText: raw?.heroText ?? null,
    logo: toImageRef(raw?.logo),
    announcement: announcementText
      ? {text: announcementText, href: cleanString(raw?.announcement?.href)}
      : null,
    contactEmail: raw?.contactEmail ?? null,
    contactPhone: raw?.contactPhone ?? null,
    whatsapp: cleanString(raw?.whatsapp),
    social: {
      facebook: cleanString(raw?.social?.facebook),
      instagram: cleanString(raw?.social?.instagram),
      tiktok: cleanString(raw?.social?.tiktok),
      youtube: cleanString(raw?.social?.youtube),
    },
    shipping: {
      insideDhaka: toMoney(raw?.shipping?.insideDhakaFee, currency) ?? createMoney(0, currency),
      outsideDhaka: toMoney(raw?.shipping?.outsideDhakaFee, currency) ?? createMoney(0, currency),
      freeFrom: toMoney(raw?.shipping?.freeShippingThreshold, currency),
    },
    enabledPaymentMethods: methods.length > 0 ? methods : ['cod'],
    paymentInstructions: {
      bkashNumber: raw?.paymentInstructions?.bkashNumber ?? null,
      nagadNumber: raw?.paymentInstructions?.nagadNumber ?? null,
      bankDetails: raw?.paymentInstructions?.bankDetails ?? null,
    },
    jerseyCustomisationFee: toMoney(raw?.jerseyCustomisationFee, currency) ?? createMoney(0, currency),
    defaultSeo: toSeoMetadata(raw?.defaultSeo),
  }
}
