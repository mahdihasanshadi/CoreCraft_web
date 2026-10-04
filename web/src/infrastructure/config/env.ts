/**
 * The one place environment variables are read.
 *
 * Everything downstream receives plain values, so no layer above this has to
 * know which variables exist or care that `process.env` is involved.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy web/.env.example to web/.env.local and fill it in.`,
    )
  }
  return value
}

export interface SanityConnectionConfig {
  readonly projectId: string
  /** Public catalogue. */
  readonly dataset: string
  /** Private orders, customers and enquiries. Server-only access. */
  readonly commerceDataset: string
  readonly apiVersion: string
  readonly studioUrl: string
}

export interface StorefrontConfig {
  readonly currency: string
  readonly locale: string
  /** Canonical origin, used to make metadata URLs absolute. */
  readonly siteUrl: string
  /** Where the standalone Studio runs, for "open the Studio" links. */
  readonly studioUrl: string
  /** True in production, where cookies must be Secure. */
  readonly secureCookies: boolean
}

export const sanityConfig: SanityConnectionConfig = {
  projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
  dataset: required('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET),
  commerceDataset: process.env.SANITY_COMMERCE_DATASET ?? 'commerce',
  /**
   * Pinned deliberately. Bumping this date opts into new API behaviour, so it
   * should be a reviewed change and never drift with the clock.
   */
  apiVersion: '2026-10-04',
  studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333',
}

export const storefrontConfig: StorefrontConfig = {
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? 'BDT',
  locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en-IN',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  studioUrl: sanityConfig.studioUrl,
  secureCookies: process.env.NODE_ENV === 'production',
}

/**
 * Server-only read token. Absent is a supported state: published content still
 * renders, drafts and Presentation Tool do not.
 */
export const sanityReadToken = process.env.SANITY_API_READ_TOKEN ?? null

/**
 * Server-only write token with Editor rights on the commerce dataset. Absent
 * means orders and enquiries cannot be saved; the forms say so instead of
 * failing silently.
 */
export const sanityWriteToken = process.env.SANITY_API_WRITE_TOKEN ?? null

/**
 * Secret that signs customer session cookies. At least 32 characters. Absent
 * means sign-in is unavailable; guest checkout still works.
 */
export const authSecret = process.env.AUTH_SECRET ?? null
