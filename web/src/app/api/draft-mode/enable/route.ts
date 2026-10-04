import {defineEnableDraftMode} from 'next-sanity/draft-mode'

import {sanityReadToken} from '@/infrastructure/config/env'
import {client} from '@/infrastructure/sanity/client'

/**
 * Presentation Tool calls this to switch the site into draft mode. Without a
 * read token it cannot see drafts, so the route exists but previews stay on
 * published content until SANITY_API_READ_TOKEN is set.
 */
export const {GET} = defineEnableDraftMode({
  client: client.withConfig({token: sanityReadToken ?? undefined}),
})
