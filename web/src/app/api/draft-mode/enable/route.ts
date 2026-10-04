import {defineEnableDraftMode} from 'next-sanity/draft-mode'
import {NextResponse} from 'next/server'

import {sanityReadToken} from '@/infrastructure/config/env'
import {client} from '@/infrastructure/sanity/client'

/**
 * Presentation Tool calls this to switch the site into draft mode.
 *
 * Draft mode needs a read token. Without one the route answers with a clear
 * 503 rather than a stack trace, so an editor opening Presentation sees why
 * previews only show published content.
 */
const handler = sanityReadToken
  ? defineEnableDraftMode({client: client.withConfig({token: sanityReadToken})}).GET
  : () =>
      NextResponse.json(
        {
          error: 'Draft previews are not configured.',
          fix: 'Set SANITY_API_READ_TOKEN in web/.env.local to a Viewer token and restart the dev server.',
        },
        {status: 503},
      )

export const GET = handler
