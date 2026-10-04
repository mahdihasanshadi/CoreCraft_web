import type {SiteSettings} from '../domain/site-settings'

export interface SiteSettingsRepository {
  /** Always resolves. The adapter supplies defaults when nothing is published. */
  get(): Promise<SiteSettings>
}
