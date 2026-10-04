import type {CurrencyCode} from '@/core/domain/money'
import type {SiteSettings} from '@/core/domain/site-settings'
import type {SiteSettingsRepository} from '@/core/ports/site-settings-repository'

import {sanityFetch} from './live'
import {toSiteSettings, type RawSiteSettings} from './mappers/to-site-settings'
import {SITE_SETTINGS_QUERY} from './queries'

export interface SanitySiteSettingsRepositoryDeps {
  readonly currency: CurrencyCode
  readonly fallbackStoreName: string
}

export function createSanitySiteSettingsRepository({
  currency,
  fallbackStoreName,
}: SanitySiteSettingsRepositoryDeps): SiteSettingsRepository {
  return {
    async get(): Promise<SiteSettings> {
      const {data} = await sanityFetch({query: SITE_SETTINGS_QUERY})
      return toSiteSettings(data as RawSiteSettings | null, {currency, storeName: fallbackStoreName})
    },
  }
}
