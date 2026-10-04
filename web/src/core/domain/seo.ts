import type {ImageRef} from './image'

/** Editor-supplied overrides for how a page presents itself to crawlers. */
export interface SeoMetadata {
  readonly title: string | null
  readonly description: string | null
  readonly shareImage: ImageRef | null
}

export const emptySeoMetadata: SeoMetadata = {
  title: null,
  description: null,
  shareImage: null,
}
