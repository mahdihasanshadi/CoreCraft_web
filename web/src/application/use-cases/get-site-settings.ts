import type {SiteSettings} from '@/core/domain/site-settings'
import type {SiteSettingsRepository} from '@/core/ports/site-settings-repository'

export interface GetSiteSettingsDeps {
  readonly settings: SiteSettingsRepository
}

export type GetSiteSettings = () => Promise<SiteSettings>

export function makeGetSiteSettings({settings}: GetSiteSettingsDeps): GetSiteSettings {
  return function getSiteSettings() {
    return settings.get()
  }
}
