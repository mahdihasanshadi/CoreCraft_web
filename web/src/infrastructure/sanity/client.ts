import {createClient} from 'next-sanity'

import {sanityConfig} from '../config/env'

export const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: sanityConfig.apiVersion,
  // Edge-cached reads. Fast, and fresh enough for published content.
  useCdn: true,
  // Enables click-to-edit. The invisible marker characters are only injected
  // when a fetch asks for them, which happens in draft mode only.
  stega: {studioUrl: sanityConfig.studioUrl},
})
